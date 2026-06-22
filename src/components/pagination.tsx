import {
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { PaginationButton } from "./buttons";

const Pagination = ({
    localLimit,
    selectCb,
    preDisabled,
    nextDisabled,
    setLocalOffset,
    pagination,
}: any) => {
    const currentPage = pagination?.currentPage || 1;
    const totalPages = pagination?.totalPages || 1;

    return (
        <div
            id="account-pagination"
            className="
        my-4 w-full
        flex flex-col gap-3
        sm:flex-row sm:items-center sm:justify-between
        text-sm text-muted-foreground
      "
        >
            {/* Rows per page */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Rows per page
                </label>

                <select
                    value={localLimit}
                    onChange={selectCb}
                    className="
            h-10 min-w-[88px]
            px-3 pr-8 rounded-md
            border border-border bg-input
            text-sm font-medium text-foreground
            shadow-sm outline-none
            transition-all duration-200
            hover:border-primary
            focus:ring-4 focus:ring-primary/10 focus:border-primary
          "
                >
                    {[10, 20, 50].map((v) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 justify-start sm:justify-end">
                <PaginationButton
                    disabled={preDisabled}
                    icon={<ChevronFirst size={18} />}
                    onClick={() => setLocalOffset(1)}
                />

                <PaginationButton
                    disabled={preDisabled}
                    icon={<ChevronLeft size={18} />}
                    onClick={() => setLocalOffset((pre: number) => pre - 1)}
                />

                <div className="min-w-[110px] px-4 h-10 flex items-center justify-center rounded-md bg-secondary border border-border text-sm font-medium text-secondary-foreground whitespace-nowrap">
                    Page {currentPage} of {totalPages}
                </div>

                <PaginationButton
                    disabled={nextDisabled}
                    icon={<ChevronRight size={18} />}
                    onClick={() => setLocalOffset((pre: number) => pre + localLimit)}
                />

                <PaginationButton
                    disabled={nextDisabled}
                    icon={<ChevronLast size={18} />}
                    onClick={() => setLocalOffset(totalPages)}
                />
            </div>
        </div>
    );
};

export default Pagination;