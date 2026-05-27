const TextInput = (({ label, value, onChange, placeholder, mandatory = false, error = "", type = "text" }: any) => {
    return (
        <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
                {label}{mandatory && <span className="text-red-500">*</span>}
            </label>

            <input
                value={value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                className="w-full h-8 rounded-sm border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200" />
            {!!error?.length && (
                <p className="text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    )
});

const TextArea = (({ label, value, onChange, placeholder, mandatory = false, error = "", rows = 4 }: any) => {
    return (
        <div className="w-full flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">{label}{mandatory && <span className="text-red-500">*</span>}</label>
            <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200" />

            {!!error?.length && (
                <p className="text-xs text-red-500">
                    {error}
                </p>
            )}
        </div>
    )
})

const SelectInput = (({ label, value, onChange, options, mandatory = false, error = "" }: any) => (
    <div className="w-full flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
            {label}{mandatory && <span className="text-red-500">*</span>}
        </label>

        <select
            value={value}
            onChange={onChange}
            className=" w-full  h-8 rounded-md border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 cursor-pointer">
            {options?.map((option: any, idx: any) => (
                <option key={idx} value={idx == 0 ? "" : option?.value}>
                    {option?.label}
                </option>
            ))}
        </select>
        {!!error?.length && (
            <p className="text-xs text-red-500">
                {error}
            </p>
        )}
    </div>
))

export { TextInput, SelectInput, TextArea }