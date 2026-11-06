import { api, type ApiListResponse } from "@/lib/api";
import {
  connectCatalogSocket,
  type CatalogEvent,
  type SocketConnection,
} from "@/lib/catalog-socket";

export type CatalogStatus = "idle" | "loading" | "ready" | "error";

export type Brand = {
  id: string;
  code: string;
  name: { ar: string; en: string };
  logoUrl: string;
  active: boolean;
};

export type Car = {
  id: string;
  model: { ar: string; en: string };
  year: number;
  brandId: string;
  active: boolean;
};

export type Category = {
  id: string;
  name: { ar: string; en: string };
  active: boolean;
};

export type CatalogState = {
  status: CatalogStatus;
  connection: SocketConnection;
  brands: Brand[];
  cars: Car[];
  categories: Category[];
  error: string | null;
};

const INITIAL_STATE: CatalogState = {
  status: "idle",
  connection: "disconnected",
  brands: [],
  cars: [],
  categories: [],
  error: null,
};

let state: CatalogState = INITIAL_STATE;
const listeners = new Set<() => void>();
let started = false;
let stopSocket: (() => void) | null = null;

function setState(patch: Partial<CatalogState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function getCatalogState(): CatalogState {
  return state;
}

export function getServerCatalogState(): CatalogState {
  return INITIAL_STATE;
}

export function subscribeCatalog(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    void ensureStarted();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) return [...items, item];
  const next = [...items];
  next[index] = item;
  return next;
}

function applyEvent(event: CatalogEvent): void {
  if (event.entity === "brand") {
    const brand = event.data as Brand;
    if (event.action === "deleted") {
      setState({ brands: state.brands.filter((item) => item.id !== brand.id) });
    } else {
      setState({ brands: upsert(state.brands, brand) });
    }
    return;
  }
  if (event.entity === "car") {
    const car = event.data as Car;
    if (event.action === "deleted") {
      setState({ cars: state.cars.filter((item) => item.id !== car.id) });
    } else {
      setState({ cars: upsert(state.cars, car) });
    }
    return;
  }
  const category = event.data as Category;
  if (event.action === "deleted") {
    setState({
      categories: state.categories.filter((item) => item.id !== category.id),
    });
  } else {
    setState({ categories: upsert(state.categories, category) });
  }
}

async function loadCatalog(): Promise<void> {
  setState({ status: "loading", error: null });
  try {
    const [brands, cars, categories] = await Promise.all([
      api.get<ApiListResponse<Brand>>("/api/brands/"),
      api.get<ApiListResponse<Car>>("/api/cars/"),
      api.get<ApiListResponse<Category>>("/api/categories/"),
    ]);
    setState({
      brands: brands.results,
      cars: cars.results,
      categories: categories.results,
      status: "ready",
    });
  } catch (error) {
    setState({ status: "error", error: toErrorMessage(error) });
  }
}

function ensureSocket(): void {
  if (stopSocket) return;
  stopSocket = connectCatalogSocket(applyEvent, (connection) =>
    setState({ connection }),
  );
}

async function ensureStarted(): Promise<void> {
  if (started) return;
  started = true;
  await loadCatalog();
  ensureSocket();
}

export async function reloadCatalog(): Promise<void> {
  started = false;
  await ensureStarted();
}

export async function createBrand(draft: Omit<Brand, "id">): Promise<Brand> {
  const brand = await api.post<Brand>("/api/brands/", draft);
  setState({ brands: upsert(state.brands, brand) });
  return brand;
}

export async function updateBrand(
  id: string,
  draft: Omit<Brand, "id">,
): Promise<Brand> {
  const brand = await api.patch<Brand>(`/api/brands/${id}/`, draft);
  setState({ brands: upsert(state.brands, brand) });
  return brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await api.delete(`/api/brands/${id}/`);
  setState({ brands: state.brands.filter((item) => item.id !== id) });
}

export async function createCar(draft: Omit<Car, "id">): Promise<Car> {
  const car = await api.post<Car>("/api/cars/", draft);
  setState({ cars: upsert(state.cars, car) });
  return car;
}

export async function updateCar(
  id: string,
  draft: Omit<Car, "id">,
): Promise<Car> {
  const car = await api.patch<Car>(`/api/cars/${id}/`, draft);
  setState({ cars: upsert(state.cars, car) });
  return car;
}

export async function deleteCar(id: string): Promise<void> {
  await api.delete(`/api/cars/${id}/`);
  setState({ cars: state.cars.filter((item) => item.id !== id) });
}

export async function createCategory(
  draft: Omit<Category, "id">,
): Promise<Category> {
  const category = await api.post<Category>("/api/categories/", draft);
  setState({ categories: upsert(state.categories, category) });
  return category;
}

export async function updateCategory(
  id: string,
  draft: Omit<Category, "id">,
): Promise<Category> {
  const category = await api.patch<Category>(
    `/api/categories/${id}/`,
    draft,
  );
  setState({ categories: upsert(state.categories, category) });
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/categories/${id}/`);
  setState({ categories: state.categories.filter((item) => item.id !== id) });
}