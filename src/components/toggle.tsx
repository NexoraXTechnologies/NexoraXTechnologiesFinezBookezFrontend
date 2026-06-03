import { capitalizeFirstLttr } from "../utils/templateKeyLabel"

const Toggle = ({ arr, state, setState }: any) => {
    console.log("here", arr)
    return (
        <div className="inline-flex p-1 bg-gray-200 rounded-md me-2">
            {arr?.map((e) =>
                <button
                    onClick={() => setState(e)}
                    className={`px-5 py-1 text-sm rounded-md font-medium transition-all duration-300 ${state === e
                        ? "bg-white text-black shadow-md"
                        : "text-gray-500 cursor-pointer"
                        }`}
                >
                    {capitalizeFirstLttr(e)}
                </button>
            )}
        </div>
    )
}

export default Toggle;