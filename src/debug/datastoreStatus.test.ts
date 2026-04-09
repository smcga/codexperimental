import { describe, expect, it } from "vitest";

import {
  pushDatastoreDebugMessage,
  setDatastoreDebugEnabled,
  subscribeDatastoreDebugMessages
} from "./datastoreStatus";

describe("datastoreStatus", () => {
  it("collects short entries when enabled and clears when disabled", () => {
    const snapshots: string[][] = [];
    const unsubscribe = subscribeDatastoreDebugMessages((entries) => {
      snapshots.push(entries.map((entry) => entry.message));
    });

    setDatastoreDebugEnabled(true);
    pushDatastoreDebugMessage("GET doodles → postgres");
    pushDatastoreDebugMessage("POST effects → postgres+upstash-kv");

    expect(snapshots.at(-1)).toEqual([
      "GET doodles → postgres",
      "POST effects → postgres+upstash-kv"
    ]);

    setDatastoreDebugEnabled(false);
    expect(snapshots.at(-1)).toEqual([]);

    unsubscribe();
  });

  it("dedupes rapid duplicate messages", () => {
    const snapshots: string[][] = [];
    const unsubscribe = subscribeDatastoreDebugMessages((entries) => {
      snapshots.push(entries.map((entry) => entry.message));
    });

    setDatastoreDebugEnabled(true);
    pushDatastoreDebugMessage("GET views → upstash-kv");
    pushDatastoreDebugMessage("GET views → upstash-kv");

    expect(snapshots.at(-1)).toEqual(["GET views → upstash-kv"]);

    setDatastoreDebugEnabled(false);
    unsubscribe();
  });
});
