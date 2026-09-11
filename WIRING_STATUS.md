# Contract Wiring Status

## ✅ FULLY WIRED (DRY - Single Source of Truth)

### 1. Execution Backend Registry
**File:** `src/lib/contract-registry.ts:84-88`
```typescript
export function getExecutionBackendEntry(backend: string) {
  const contract = CONTRACT_REGISTRY.find((c) => c.id === backend);
  if (!contract?.address || !contract?.abi) return null;
  return { name: contract.name, address: contract.address, abi: contract.abi };
}
```
**Status:** ✅ Derives from CONTRACT_REGISTRY  
**Add a contract:** Just add to CONTRACT_REGISTRY, auto-available everywhere

---

### 2. Frontend Backend Selector
**File:** `src/app/contract/page.tsx:1057-1062`
```typescript
<SelectContent>
  {getExecutableBackends().map((backend) => (
    <SelectItem key={backend.id} value={backend.id}>
      {backend.name}
    </SelectItem>
  ))}
</SelectContent>
```
**Status:** ✅ Dynamically renders from CONTRACT_REGISTRY  
**Add a contract:** Auto-appears in backend dropdown

---

### 3. ExecutionBackend TypeScript Type
**File:** `src/lib/types.ts:7`
```typescript
export type ExecutionBackend = (typeof CONTRACT_REGISTRY)[number]["id"];
```
**Status:** ✅ Derived from CONTRACT_REGISTRY  
**Add a contract:** Type system auto-updates

---

### 4. Contract Selector (UI)
**File:** `src/app/contract/page.tsx:802-809`
```typescript
{CONTRACT_REGISTRY.filter((c) => c.category === "sequence").map((c) => (...))}
{CONTRACT_REGISTRY.filter((c) => c.category === "drainer").map((c) => (...))}
```
**Status:** ✅ Already uses CONTRACT_REGISTRY dynamically

---

## ⚠️ PARTIALLY WIRED (Still Have Hardcoding)

### Strategy Preset Bindings
**File:** `src/lib/strategy-preset-bindings.ts`

**Problem:** Each strategy mode function hardcodes which backend to use:
- `getDirectPreset()` → hardcoded `'stealth-exchange'` (line 54, 83)
- `getPermit2Preset()` → hardcoded `'permit2-executor'` (line 126)
- `getMulticallPreset()` → hardcoded `'batch-multicall'` (line 187)
- `getEIP7702Preset()` → hardcoded `'stealth-exchange'` (line 218, 296)

**Status:** ⚠️ Ignores the `backend` parameter  
**Impact:** Can't use alternative contracts for the same strategy

---

## 📋 Action Items

### Priority 1: Wire Strategy Bindings to All Contracts
1. Make preset functions USE the `backend` parameter instead of hardcoding
2. Dynamically lookup function signatures from CONTRACT_REGISTRY
3. Allow any contract with the right function to work with any strategy

**Example:** Currently `direct` strategy ONLY uses StealthExchange, but if another contract has a `batchPermitTransfer` function, it should work too.

### Priority 2: Add Contract Capability Tags
Add to ContractMeta:
```typescript
capabilities?: {
  supportsDirectTransfer?: boolean;
  supportsPermit2?: boolean;
  supportsPermit?: boolean;
  supportsBatch?: boolean;
  supportsEIP712?: boolean;
}
```

Then filter strategy suggestions based on what a contract can actually do.

### Priority 3: Auto-Wire Function Selection
Instead of hardcoding `functionKey: 'batchPermitTransferFromBatch'`,  
Search CONTRACT_REGISTRY for contracts with matching function signatures.

---

## Summary

| Aspect | Status | Location |
|--------|--------|----------|
| Registry lookup | ✅ DRY | `contract-registry.ts` |
| Frontend backend selector | ✅ DRY | `contract/page.tsx` |
| ExecutionBackend type | ✅ DRY | `types.ts` |
| Contract list UI | ✅ DRY | `contract/page.tsx` |
| Strategy bindings | ⚠️ Hardcoded | `strategy-preset-bindings.ts` |

**Add a new contract:** 
- ✅ Add to CONTRACT_REGISTRY 
- ✅ Auto-appears in all UIs
- ✅ Auto-available in ExecutionBackend type
- ⚠️ NOT automatically wired to strategies (still manual)
