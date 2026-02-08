import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { getEffectDebugConfig } from "../debug/effectDebug";

export type ParamType = "number" | "string" | "boolean" | "object" | "array" | "union";

type ParamConstraints = {
  min?: number;
  max?: number;
  options?: string[];
};

type ParamInfo = {
  path: string;
  type: ParamType;
  defaultValue: string;
  constraints: string;
  behavior: string;
  automatable: "yes" | "no" | "unknown";
};

type EffectDocEntry = {
  name: string;
  className: string;
  modulePath: string;
  renderer: "Canvas2D" | "WebGL2" | "hybrid";
  description: string;
  params: ParamInfo[];
  audioFeatures: string[];
  performanceNotes: string[];
};

type DefaultsMap = Record<string, string | number | boolean | null>;

const REGISTRY_PATH = path.resolve(process.cwd(), "src/renderer/effects/index.ts");
const LOAD_CONFIG_PATH = path.resolve(process.cwd(), "src/config/loadConfig.ts");

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const formatDefaultValue = (value: string | number | boolean | null | undefined): string => {
  if (value === undefined) {
    return "no explicit default";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
};

const formatConstraints = (constraints: ParamConstraints | undefined): string => {
  if (!constraints) {
    return "unspecified";
  }
  const parts: string[] = [];
  if (constraints.min !== undefined || constraints.max !== undefined) {
    parts.push(`min ${constraints.min ?? "?"}, max ${constraints.max ?? "?"}`);
  }
  if (constraints.options && constraints.options.length > 0) {
    parts.push(`options: ${constraints.options.join(", ")}`);
  }
  return parts.length > 0 ? parts.join("; ") : "unspecified";
};

const inferTypeFromValue = (value: string | number | boolean | null | undefined): ParamType | null => {
  if (value === null) {
    return "union";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "string") {
    return "string";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return null;
};

const parseSourceFile = (filePath: string): ts.SourceFile => {
  const source = fs.readFileSync(filePath, "utf-8");
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
};

const resolveModulePath = (modulePath: string): string => {
  const base = path.resolve(path.dirname(REGISTRY_PATH), modulePath);
  const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  const match = candidates.find((candidate) => fs.existsSync(candidate));
  return match ?? base;
};

const getLeadingDescription = (sourceText: string): string | null => {
  const trimmed = sourceText.trimStart();
  if (trimmed.startsWith("/*")) {
    const endIndex = trimmed.indexOf("*/");
    if (endIndex !== -1) {
      return trimmed.slice(2, endIndex).trim().replace(/\s+/g, " ");
    }
  }
  if (trimmed.startsWith("//")) {
    const lines = trimmed.split("\n");
    const commentLines = lines.filter((line) => line.trim().startsWith("//"));
    if (commentLines.length > 0) {
      return commentLines
        .map((line) => line.replace("//", "").trim())
        .join(" ")
        .trim();
    }
  }
  return null;
};

const parseBlendModes = (): string[] => {
  const sourceFile = parseSourceFile(LOAD_CONFIG_PATH);
  const blendModes: string[] = [];
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== "BLEND_MODES") {
        return;
      }
      if (!decl.initializer) {
        return;
      }
      const initializer = ts.isAsExpression(decl.initializer) ? decl.initializer.expression : decl.initializer;
      if (!ts.isArrayLiteralExpression(initializer)) {
        return;
      }
      initializer.elements.forEach((element) => {
        if (ts.isStringLiteral(element)) {
          blendModes.push(element.text);
        }
      });
    });
  });
  return blendModes;
};

const getImportMap = (sourceFile: ts.SourceFile): Map<string, string> => {
  const importMap = new Map<string, string>();
  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node)) {
      return;
    }
    const namedBindings = node.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      return;
    }
    namedBindings.elements.forEach((element) => {
      importMap.set(element.name.text, (node.moduleSpecifier as ts.StringLiteral).text);
    });
  });
  return importMap;
};

const parseRegistry = (): Array<{ name: string; className: string; modulePath: string }> => {
  const sourceFile = parseSourceFile(REGISTRY_PATH);
  const importMap = getImportMap(sourceFile);
  const entries: Array<{ name: string; className: string; modulePath: string }> = [];

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    const declaration = node.declarationList.declarations.find(
      (decl) => ts.isIdentifier(decl.name) && decl.name.text === "effectRegistry"
    );
    if (!declaration || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
      return;
    }
    declaration.initializer.properties.forEach((property) => {
      if (!ts.isPropertyAssignment(property)) {
        return;
      }
      const nameNode = property.name;
      const effectName = ts.isIdentifier(nameNode) ? nameNode.text : ts.isStringLiteral(nameNode) ? nameNode.text : null;
      if (!effectName) {
        return;
      }
      if (!ts.isNewExpression(property.initializer)) {
        return;
      }
      const className = ts.isIdentifier(property.initializer.expression)
        ? property.initializer.expression.text
        : property.initializer.expression.getText(sourceFile);
      const modulePath = importMap.get(className) ?? "unknown";
      entries.push({ name: effectName, className, modulePath });
    });
  });

  return entries;
};

type ParamExtraction = {
  paramPaths: Set<string>;
  defaults: DefaultsMap;
  paramDefaults: Map<string, string | number | boolean | null>;
  paramConstraints: Map<string, ParamConstraints>;
  audioFeatures: Set<string>;
  renderer: "Canvas2D" | "WebGL2" | "hybrid";
  performanceNotes: Set<string>;
  description: string | null;
};

const getDefaultsFromObject = (sourceFile: ts.SourceFile): DefaultsMap => {
  const defaults: DefaultsMap = {};
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name) || !decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) {
        return;
      }
      if (!decl.name.text.endsWith("DEFAULTS") && !decl.name.text.endsWith("_DEFAULTS")) {
        return;
      }
      decl.initializer.properties.forEach((prop) => {
        if (!ts.isPropertyAssignment(prop)) {
          return;
        }
        const keyNode = prop.name;
        const key = ts.isIdentifier(keyNode) ? keyNode.text : ts.isStringLiteral(keyNode) ? keyNode.text : null;
        if (!key) {
          return;
        }
        const value = literalFromExpression(prop.initializer);
        if (value !== undefined) {
          defaults[key] = value;
        }
      });
    });
  });
  return defaults;
};

const literalFromExpression = (expression: ts.Expression): string | number | boolean | null | undefined => {
  if (ts.isNumericLiteral(expression)) {
    return Number(expression.text);
  }
  if (ts.isStringLiteral(expression)) {
    return expression.text;
  }
  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (expression.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  return undefined;
};

const resolveParamAliasInitializer = (initializer: ts.Expression): string | null => {
  if (ts.isIdentifier(initializer)) {
    return initializer.text;
  }
  if (ts.isAsExpression(initializer)) {
    return resolveParamAliasInitializer(initializer.expression);
  }
  return null;
};

const buildParamPath = (segments: Array<{ type: "property" | "element"; value: string }>): string => {
  let pathValue = "params";
  segments.forEach((segment) => {
    if (segment.type === "property") {
      pathValue += `.${segment.value}`;
    } else if (VALID_IDENTIFIER.test(segment.value)) {
      pathValue += `.${segment.value}`;
    } else {
      pathValue += `[${segment.value}]`;
    }
  });
  return pathValue;
};

const getParamSegments = (
  node: ts.Expression,
  paramAliases: Set<string>
): Array<{ type: "property" | "element"; value: string }> | null => {
  if (ts.isIdentifier(node)) {
    return paramAliases.has(node.text) ? [] : null;
  }
  if (ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain(node)) {
    const parentSegments = getParamSegments(node.expression, paramAliases);
    if (!parentSegments) {
      return null;
    }
    return [...parentSegments, { type: "property", value: node.name.text }];
  }
  if (ts.isElementAccessExpression(node) || ts.isElementAccessChain(node)) {
    const parentSegments = getParamSegments(node.expression, paramAliases);
    if (!parentSegments) {
      return null;
    }
    const argument = node.argumentExpression;
    if (!argument) {
      return [...parentSegments, { type: "element", value: "" }];
    }
    if (ts.isNumericLiteral(argument)) {
      return [...parentSegments, { type: "element", value: argument.text }];
    }
    if (ts.isStringLiteral(argument)) {
      return [...parentSegments, { type: "element", value: argument.text }];
    }
    return [...parentSegments, { type: "element", value: "" }];
  }
  return null;
};

const collectParamData = (filePath: string): ParamExtraction => {
  const sourceText = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const defaults = getDefaultsFromObject(sourceFile);
  const paramPaths = new Set<string>();
  const paramDefaults = new Map<string, string | number | boolean | null>();
  const paramConstraints = new Map<string, ParamConstraints>();
  const audioFeatures = new Set<string>();
  const performanceNotes = new Set<string>();
  const description = getLeadingDescription(sourceText);

  const paramAliases = new Set<string>(["params"]);
  const audioAliases = new Set<string>(["audio"]);

  const recordParamPath = (segments: Array<{ type: "property" | "element"; value: string }>): string => {
    const pathValue = buildParamPath(segments);
    paramPaths.add(pathValue);
    return pathValue;
  };

  const recordConstraint = (paramPath: string, constraint: ParamConstraints): void => {
    const current = paramConstraints.get(paramPath) ?? {};
    paramConstraints.set(paramPath, { ...current, ...constraint });
  };

  const recordDefault = (paramPath: string, value: string | number | boolean | null | undefined): void => {
    if (value === undefined) {
      return;
    }
    if (!paramDefaults.has(paramPath)) {
      paramDefaults.set(paramPath, value);
    }
  };

  const inferRenderer = (): "Canvas2D" | "WebGL2" | "hybrid" => {
    if (filePath.includes(`${path.sep}gl${path.sep}`)) {
      performanceNotes.add("WebGL2 shader pipeline; performance depends on GPU.");
      return "WebGL2";
    }
    if (sourceText.includes("WebGL2RenderingContext") || sourceText.includes("WebGLEffectBase")) {
      performanceNotes.add("Hybrid WebGL2 rendering with Canvas2D blitting.");
      return "hybrid";
    }
    if (sourceText.includes("ImageData") || sourceText.includes("putImageData")) {
      performanceNotes.add("Uses ImageData per frame; CPU cost scales with resolution.");
    }
    return "Canvas2D";
  };

  const renderer = inferRenderer();

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const aliasTarget = resolveParamAliasInitializer(node.initializer);
      if (aliasTarget && paramAliases.has(aliasTarget) && ts.isIdentifier(node.name)) {
        paramAliases.add(node.name.text);
      }
      const audioAliasTarget = resolveParamAliasInitializer(node.initializer);
      if (audioAliasTarget && audioAliases.has(audioAliasTarget) && ts.isIdentifier(node.name)) {
        audioAliases.add(node.name.text);
      }
    }

    if (ts.isVariableDeclaration(node) && node.initializer && ts.isObjectBindingPattern(node.name)) {
      const initializerName = resolveParamAliasInitializer(node.initializer);
      if (initializerName && paramAliases.has(initializerName)) {
        node.name.elements.forEach((element) => {
          const propertyName = element.propertyName ?? element.name;
          const key = ts.isIdentifier(propertyName)
            ? propertyName.text
            : ts.isStringLiteral(propertyName)
              ? propertyName.text
              : null;
          if (!key) {
            return;
          }
          const segments = [{ type: "property" as const, value: key }];
          const pathValue = recordParamPath(segments);
          recordDefault(pathValue, element.initializer ? literalFromExpression(element.initializer) : undefined);
        });
      }
    }

    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        const segments = getParamSegments(node.left, paramAliases);
        if (segments) {
          const pathValue = recordParamPath(segments);
          recordDefault(pathValue, literalFromExpression(node.right));
        }
      }
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const functionName = node.expression.text;
      if (["clamp", "clampInt"].includes(functionName) && node.arguments.length >= 3) {
        const segments = getParamSegments(node.arguments[0], paramAliases);
        if (segments) {
          const pathValue = recordParamPath(segments);
          const min = literalFromExpression(node.arguments[1]);
          const max = literalFromExpression(node.arguments[2]);
          recordConstraint(pathValue, {
            min: typeof min === "number" ? min : undefined,
            max: typeof max === "number" ? max : undefined
          });
        }
      }
      if (functionName === "clamp01" && node.arguments.length >= 1) {
        const segments = getParamSegments(node.arguments[0], paramAliases);
        if (segments) {
          const pathValue = recordParamPath(segments);
          recordConstraint(pathValue, { min: 0, max: 1 });
        }
      }
      if (functionName.startsWith("resolve") && node.arguments.length >= 2) {
        const segments = getParamSegments(node.arguments[0], paramAliases);
        if (segments) {
          const pathValue = recordParamPath(segments);
          const defaultValue = literalFromExpression(node.arguments[1]);
          if (defaultValue !== undefined) {
            recordDefault(pathValue, defaultValue);
          } else if (ts.isPropertyAccessExpression(node.arguments[1])) {
            const targetName = node.arguments[1].expression.getText(sourceFile);
            const key = node.arguments[1].name.text;
            if (targetName.endsWith("DEFAULTS") && key in defaults) {
              recordDefault(pathValue, defaults[key]);
            }
          }
        }
      }
    }

    if (ts.isPropertyAccessExpression(node) || ts.isPropertyAccessChain(node)) {
      const segments = getParamSegments(node, paramAliases);
      if (segments && segments.length > 0) {
        recordParamPath(segments);
      }
      const audioSegments = getParamSegments(node, audioAliases);
      if (audioSegments && audioSegments.length > 0) {
        audioFeatures.add(audioSegments[0].value);
      }
    }

    if (ts.isElementAccessExpression(node) || ts.isElementAccessChain(node)) {
      const segments = getParamSegments(node, paramAliases);
      if (segments && segments.length > 0) {
        recordParamPath(segments);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  Object.entries(defaults).forEach(([key, value]) => {
    const pathValue = `params.${key}`;
    if (paramPaths.has(pathValue)) {
      recordDefault(pathValue, value);
    }
  });

  return {
    paramPaths,
    defaults,
    paramDefaults,
    paramConstraints,
    audioFeatures,
    renderer,
    performanceNotes,
    description
  };
};

const renderEffectSection = (entry: EffectDocEntry): string => {
  const paramsTable = entry.params
    .map(
      (param) =>
        `| \`${param.path}\` | ${param.type} | ${param.defaultValue} | ${param.constraints} | ${param.behavior} | ${param.automatable} |`
    )
    .join("\n");
  const audioList = entry.audioFeatures.length > 0 ? entry.audioFeatures.join(", ") : "None detected";
  const performanceList = entry.performanceNotes.length > 0 ? entry.performanceNotes.join(" ") : "None noted.";

  return [
    `## Effect: ${entry.name}`,
    ``,
    `- **Registry key:** \`${entry.name}\``,
    `- **Implementation:** \`${entry.modulePath}\` (class \`${entry.className}\`)`,
    `- **Renderer:** ${entry.renderer}`,
    `- **Description:** ${entry.description}`,
    `- **Audio features:** ${audioList}`,
    `- **Performance notes:** ${performanceList}`,
    ``,
    `### Parameters`,
    ``,
    `| JSON path | Type | Default | Range/constraints | Behaviour notes | Automatable |`,
    `| --- | --- | --- | --- | --- | --- |`,
    paramsTable || `| _No params detected_ | - | - | - | - | - |`,
    ``,
    `### Minimal layer usage`,
    ``,
    "```json",
    JSON.stringify(
      {
        effect: entry.name,
        opacity: 1,
        blend: "source-over",
        params: {}
      },
      null,
      2
    ),
    "```",
    ``
  ].join("\n");
};

export const buildEffectDocs = (): EffectDocEntry[] => {
  const registryEntries = parseRegistry();
  return registryEntries.map((entry) => {
    const modulePath = entry.modulePath === "unknown" ? "unknown" : resolveModulePath(entry.modulePath);
    const relativeModulePath =
      entry.modulePath === "unknown" ? "unknown" : path.relative(process.cwd(), modulePath).replace(/\\\\/g, "/");
    const extraction = entry.modulePath === "unknown"
      ? {
          paramPaths: new Set<string>(),
          defaults: {},
          paramDefaults: new Map<string, string | number | boolean | null>(),
          paramConstraints: new Map<string, ParamConstraints>(),
          audioFeatures: new Set<string>(),
          renderer: "Canvas2D" as const,
          performanceNotes: new Set<string>(),
          description: null
        }
      : collectParamData(modulePath);

    const debugConfig = getEffectDebugConfig(entry.name);
    const debugControls = debugConfig?.controls ?? [];
    const debugControlMap = new Map(debugControls.map((control) => [control.key, control]));

    const mergedParamPaths = new Set<string>(extraction.paramPaths);
    debugControls.forEach((control) => mergedParamPaths.add(`params.${control.key}`));

    const params: ParamInfo[] = Array.from(mergedParamPaths)
      .sort()
      .map((paramPath) => {
        const key = paramPath.replace(/^params\./, "");
        const debugControl = debugControlMap.get(key);
        const defaultValue =
          extraction.paramDefaults.get(paramPath) ??
          (debugControl ? debugControl.defaultValue : undefined) ??
          (key in extraction.defaults ? extraction.defaults[key] : undefined);
        const typeFromDefault = inferTypeFromValue(defaultValue);
        const typeFromControl: ParamType | null =
          debugControl?.type === "toggle" ? "boolean" : debugControl?.type === "select" ? "string" : null;
        const type = typeFromControl ?? typeFromDefault ?? "number";
        const constraints: ParamConstraints | undefined = debugControl
          ? {
              min: debugControl.min,
              max: debugControl.max,
              options: debugControl.options?.map((option) => option.value)
            }
          : extraction.paramConstraints.get(paramPath);
        const behavior = debugControl?.label ?? "Used in effect render logic.";
        const automatable = type === "number" ? "yes" : type === "string" ? "no" : "unknown";

        return {
          path: paramPath,
          type,
          defaultValue: formatDefaultValue(defaultValue as string | number | boolean | null | undefined),
          constraints: formatConstraints(constraints),
          behavior,
          automatable
        };
      });

    const description =
      extraction.description ??
      `Implemented by ${entry.className} (${relativeModulePath}).`;

    return {
      name: entry.name,
      className: entry.className,
      modulePath: relativeModulePath,
      renderer: extraction.renderer,
      description,
      params,
      audioFeatures: Array.from(extraction.audioFeatures).sort(),
      performanceNotes: Array.from(extraction.performanceNotes),
    };
  });
};

const buildCommonParamPatterns = (effects: EffectDocEntry[]): Array<{ name: string; count: number }> => {
  const counts = new Map<string, number>();
  effects.forEach((effect) => {
    effect.params.forEach((param) => {
      const key = param.path.replace(/^params\./, "").split(/[.\[\]]/)[0];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
};

export const generateEffectsDoc = (): { markdown: string; effectNames: string[]; registryPath: string } => {
  const effects = buildEffectDocs();
  const blendModes = parseBlendModes();
  const commonParams = buildCommonParamPatterns(effects);
  const effectNames = effects.map((effect) => effect.name);

  const toc = effects.map((effect) => `- [Effect: ${effect.name}](#effect-${effect.name.replace(/_/g, "-")})`).join("\n");

  const header = [
    "# Effects Reference",
    "",
    `Generated from \`${path.relative(process.cwd(), REGISTRY_PATH).replace(/\\\\/g, "/")}\`.`,
    "",
    `Total effects: **${effects.length}**.`,
    "",
    "## Table of contents",
    "",
    toc,
    "",
    "## Cross-reference",
    "",
    "### Blend modes (layers)",
    "",
    blendModes.length > 0 ? blendModes.map((mode) => `- \`${mode}\``).join("\n") : "- No blend modes detected.",
    "",
    "### Common parameter patterns",
    "",
    commonParams.length > 0
      ? commonParams.map((entry) => `- \`${entry.name}\` (used in ${entry.count} effects)`).join("\n")
      : "- No common params detected.",
    "",
    "## Effects"
  ].join("\n");

  const body = effects.map((effect) => renderEffectSection(effect)).join("\n");
  return { markdown: `${header}\n\n${body}\n`, effectNames, registryPath: REGISTRY_PATH };
};

export const getRegistryEffectNames = (): string[] => parseRegistry().map((entry) => entry.name).sort();
