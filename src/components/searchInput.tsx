import { Search } from "lucide-react"

const SearchInput = ({ search, setSearch }) => {
    return (
        <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="account-search-input" type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-md border border-gray-200 bg-white text-sm text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
        </div>
    )
}
export default SearchInput;