import { create } from 'zustand';
type FavouriteState = { ids: string[]; toggle: (id: string) => void; has: (id: string) => boolean; };
export const useFavouriteStore = create<FavouriteState>((set, get) => ({
  ids: [], toggle: id => set(state => ({ ids: state.ids.includes(id) ? state.ids.filter(item => item !== id) : [...state.ids, id] })),
  has: id => get().ids.includes(id)
}));
