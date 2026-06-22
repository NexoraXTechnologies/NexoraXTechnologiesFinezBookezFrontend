import { Search } from "lucide-react";

const SearchInput = ({ search, setSearch, placeholder = "Search..." }: any) => {
    return (
        <div className="relative w-full sm:w-72">
            <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
                id="account-search-input"
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
          w-full h-10 pl-10 pr-4 rounded-md border
          border-border bg-input text-sm text-foreground shadow-sm
          outline-none transition-all duration-200
          placeholder:text-muted-foreground
          hover:border-primary
          focus:border-primary focus:ring-4 focus:ring-primary/10
        "
            />
        </div>
    );
};

export default SearchInput;