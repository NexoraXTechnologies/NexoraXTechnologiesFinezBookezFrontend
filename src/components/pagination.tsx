import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationButton } from "./buttons";

const Pagination = (({ localLimit, selectCb, preDisabled, nextDisabled, setLocalOffset, pagination }: any) => {
    return (
        <div
            id="account-pagination"
            className="flex justify-between flex-0 items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600">
                    Rows per page
                </label>

                <select
                    value={localLimit}
                    onChange={selectCb}
                    className="h-10 px-3 pr-8 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm outline-none transition-all duration-200 hover:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500">
                    {[10, 20, 50].map((v) => (
                        <option key={v} value={v}>
                            {v}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <PaginationButton {...{ disabled: preDisabled, icon: <ChevronFirst size={18} />, onClick: () => setLocalOffset(0) }} />
                <PaginationButton {...{ disabled: preDisabled, icon: <ChevronLeft size={18} />, onClick: () => setLocalOffset((prev) => Math.max(0, prev - localLimit)) }} />

                {/* PAGE INFO */}
                <div
                    className="px-4 h-10 flex items-center rounded-md bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                </div>

                <PaginationButton {...{ disabled: nextDisabled, icon: <ChevronRight size={18} />, onClick: () => setLocalOffset((prev) => prev + localLimit) }} />
                <PaginationButton {...{ disabled: nextDisabled, icon: <ChevronLast size={18} />, onClick: () => setLocalOffset((pagination.totalPages - 1) * localLimit) }} />
                {/* NEXT */}
            </div>
        </div>
    )
})

export default Pagination;