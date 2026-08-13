import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { DEFAULT_COUNTRY } from '@/lib/countries';
import { allocateRounded, roundTo, splitEvenly, type CurrencyCode } from '@/lib/money';
import type { RailId } from '@/lib/rails';

export type Person = {
  id: string;
  name: string;
  /** How they want to pay the collector back. */
  rail: RailId | null;
  /** Manually typed share. Ignored while `splitMode === 'items'`. */
  amount: number;
  paid: boolean;
};

export type ReceiptItem = {
  id: string;
  label: string;
  price: number;
  /** Person ids sharing this line. Empty means "everyone at the table". */
  assignedTo: string[];
};

/** `manual` = type each share. `items` = derive shares from the itemised bill. */
export type SplitMode = 'manual' | 'items';

/**
 * How the user chose to get the bill in, picked on the start screen. It decides
 * which entry screen they see and how the split defaults.
 */
export type EntryMode = 'items' | 'total' | 'scan';

export type BillState = {
  /** null until the start screen has been answered. */
  entryMode: EntryMode | null;
  restaurant: string;
  total: number;
  /** ISO 3166-1 alpha-2. The currency is derived from it. */
  country: string;
  currency: CurrencyCode;
  collectorName: string;
  handles: Partial<Record<RailId, string>>;
  people: Person[];
  items: ReceiptItem[];
  splitMode: SplitMode;
  /** The collector's own portion — deducted before collecting from others. */
  myShare: number;
  scanned: boolean;
};

/** The collector is person zero everywhere shares are computed. */
export const COLLECTOR_ID = '__me__';

let seq = 0;
const nextId = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;

function blankPerson(): Person {
  return { id: nextId(), name: '', rail: null, amount: 0, paid: false };
}

function blankItem(): ReceiptItem {
  return { id: `i${nextId()}`, label: '', price: 0, assignedTo: [] };
}

/** Line items are the source of truth for the total once there are any. */
function sumItems(items: ReceiptItem[]) {
  return Math.round(items.reduce((sum, i) => sum + i.price, 0) * 100) / 100;
}

const initialState: BillState = {
  entryMode: null,
  restaurant: '',
  total: 0,
  country: DEFAULT_COUNTRY,
  currency: 'EUR',
  collectorName: '',
  handles: {},
  people: [blankPerson(), blankPerson(), blankPerson()],
  items: [],
  splitMode: 'manual',
  myShare: 0,
  scanned: false,
};

/** What each person owes, in the order they appear (collector first). */
export type Share = { id: string; name: string; amount: number };

/**
 * In `items` mode a line is shared by whoever is assigned to it; an unassigned
 * line falls back to the whole table so the numbers always add up to the bill.
 */
function computeShares(state: BillState): Share[] {
  const ids = [COLLECTOR_ID, ...state.people.map((p) => p.id)];
  const nameOf = (id: string) =>
    id === COLLECTOR_ID
      ? state.collectorName || 'You'
      : state.people.find((p) => p.id === id)?.name || 'Person';

  if (state.splitMode === 'manual') {
    return ids.map((id) => ({
      id,
      name: nameOf(id),
      amount:
        id === COLLECTOR_ID
          ? state.myShare
          : (state.people.find((p) => p.id === id)?.amount ?? 0),
    }));
  }

  const totals = new Map<string, number>(ids.map((id) => [id, 0]));
  let itemised = 0;
  for (const item of state.items) {
    const sharers = item.assignedTo.length ? item.assignedTo : ids;
    const each = item.price / sharers.length;
    for (const id of sharers) totals.set(id, (totals.get(id) ?? 0) + each);
    itemised += item.price;
  }

  // Round as a set, so the shares still add up to the scanned total.
  const rounded = allocateRounded(
    ids.map((id) => totals.get(id) ?? 0),
    roundTo(itemised, state.currency),
    state.currency
  );

  return ids.map((id, i) => ({ id, name: nameOf(id), amount: rounded[i] }));
}

type Action =
  | { type: 'patch'; patch: Partial<BillState> }
  | { type: 'setEntryMode'; mode: EntryMode }
  | { type: 'setSplitMode'; mode: SplitMode }
  | { type: 'addItem' }
  | { type: 'patchItem'; id: string; patch: Partial<ReceiptItem> }
  | { type: 'removeItem'; id: string }
  | { type: 'setHandle'; rail: RailId; value: string }
  | { type: 'addPerson' }
  | { type: 'removePerson'; id: string }
  | { type: 'patchPerson'; id: string; patch: Partial<Person> }
  | { type: 'splitEqually' }
  | { type: 'toggleItemAssignee'; itemId: string; personId: string }
  | { type: 'applyScan'; restaurant: string; items: ReceiptItem[]; total: number }
  | { type: 'reset' };

function reducer(state: BillState, action: Action): BillState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };

    case 'setEntryMode': {
      // Switching entry mode starts the bill over — mixing a scanned receipt
      // with hand-typed lines would only produce a total nobody can explain.
      const base = {
        ...state,
        entryMode: action.mode,
        items: [],
        total: 0,
        scanned: false,
        myShare: 0,
        people: state.people.map((p) => ({ ...p, amount: 0, paid: false })),
      };
      if (action.mode === 'items') {
        return { ...base, splitMode: 'items', items: [blankItem(), blankItem(), blankItem()] };
      }
      return { ...base, splitMode: action.mode === 'scan' ? 'items' : 'manual' };
    }

    case 'addItem': {
      const items = [...state.items, blankItem()];
      return { ...state, items, total: sumItems(items) };
    }

    case 'patchItem': {
      const items = state.items.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i));
      return { ...state, items, total: sumItems(items) };
    }

    case 'removeItem': {
      const items = state.items.filter((i) => i.id !== action.id);
      return { ...state, items, total: sumItems(items) };
    }

    case 'setSplitMode': {
      if (action.mode === state.splitMode) return state;
      if (action.mode === 'items') return { ...state, splitMode: 'items' };
      // Leaving item mode: carry the derived shares over so the amounts the
      // user was just looking at are what lands in the editable fields.
      const shares = computeShares(state);
      return {
        ...state,
        splitMode: 'manual',
        myShare: shares[0]?.amount ?? 0,
        people: state.people.map((p, i) => ({ ...p, amount: shares[i + 1]?.amount ?? 0 })),
      };
    }

    case 'setHandle':
      return { ...state, handles: { ...state.handles, [action.rail]: action.value } };

    case 'addPerson':
      return { ...state, people: [...state.people, blankPerson()] };

    case 'removePerson': {
      // Dropping a person must also drop them from every receipt line.
      const people = state.people.filter((p) => p.id !== action.id);
      const items = state.items.map((item) => ({
        ...item,
        assignedTo: item.assignedTo.filter((id) => id !== action.id),
      }));
      return { ...state, people: people.length ? people : [blankPerson()], items };
    }

    case 'patchPerson':
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };

    case 'splitEqually': {
      const shares = splitEvenly(state.total, state.people.length + 1, state.currency);
      return {
        ...state,
        splitMode: 'manual',
        myShare: shares[0] ?? 0,
        people: state.people.map((p, i) => ({ ...p, amount: shares[i + 1] ?? 0 })),
      };
    }

    case 'toggleItemAssignee':
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== action.itemId) return item;
          const has = item.assignedTo.includes(action.personId);
          return {
            ...item,
            assignedTo: has
              ? item.assignedTo.filter((id) => id !== action.personId)
              : [...item.assignedTo, action.personId],
          };
        }),
      };

    case 'applyScan':
      return {
        ...state,
        restaurant: state.restaurant || action.restaurant,
        items: action.items,
        total: action.total,
        splitMode: 'items',
        scanned: true,
      };

    case 'reset':
      return { ...initialState, items: [], people: [blankPerson(), blankPerson(), blankPerson()] };
  }
}

type BillContextValue = {
  state: BillState;
  shares: Share[];
  /** Everything assigned so far, collector included. */
  assigned: number;
  remaining: number;
  /** Sum owed to the collector by everyone else. */
  toCollect: number;
  patch: (patch: Partial<BillState>) => void;
  setEntryMode: (mode: EntryMode) => void;
  setSplitMode: (mode: SplitMode) => void;
  addItem: () => void;
  patchItem: (id: string, patch: Partial<ReceiptItem>) => void;
  removeItem: (id: string) => void;
  setHandle: (rail: RailId, value: string) => void;
  addPerson: () => void;
  removePerson: (id: string) => void;
  patchPerson: (id: string, patch: Partial<Person>) => void;
  splitEqually: () => void;
  toggleItemAssignee: (itemId: string, personId: string) => void;
  applyScan: (payload: { restaurant: string; items: ReceiptItem[]; total: number }) => void;
  reset: () => void;
  shareFor: (personId: string) => number;
};

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const shares = useMemo(() => computeShares(state), [state]);

  const assigned = useMemo(
    () => roundTo(shares.reduce((sum, s) => sum + s.amount, 0), state.currency),
    [shares, state.currency]
  );

  const toCollect = useMemo(
    () =>
      roundTo(
        shares.filter((s) => s.id !== COLLECTOR_ID).reduce((sum, s) => sum + s.amount, 0),
        state.currency
      ),
    [shares, state.currency]
  );

  const shareFor = useCallback(
    (personId: string) => shares.find((s) => s.id === personId)?.amount ?? 0,
    [shares]
  );

  const value = useMemo<BillContextValue>(
    () => ({
      state,
      shares,
      assigned,
      remaining: roundTo(state.total - assigned, state.currency),
      toCollect,
      shareFor,
      patch: (patch) => dispatch({ type: 'patch', patch }),
      setEntryMode: (mode) => dispatch({ type: 'setEntryMode', mode }),
      setSplitMode: (mode) => dispatch({ type: 'setSplitMode', mode }),
      addItem: () => dispatch({ type: 'addItem' }),
      patchItem: (id, patch) => dispatch({ type: 'patchItem', id, patch }),
      removeItem: (id) => dispatch({ type: 'removeItem', id }),
      setHandle: (rail, val) => dispatch({ type: 'setHandle', rail, value: val }),
      addPerson: () => dispatch({ type: 'addPerson' }),
      removePerson: (id) => dispatch({ type: 'removePerson', id }),
      patchPerson: (id, patch) => dispatch({ type: 'patchPerson', id, patch }),
      splitEqually: () => dispatch({ type: 'splitEqually' }),
      toggleItemAssignee: (itemId, personId) =>
        dispatch({ type: 'toggleItemAssignee', itemId, personId }),
      applyScan: (payload) => dispatch({ type: 'applyScan', ...payload }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state, shares, assigned, toCollect, shareFor]
  );

  return <BillContext.Provider value={value}>{children}</BillContext.Provider>;
}

export function useBill() {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error('useBill must be used inside <BillProvider>');
  return ctx;
}
