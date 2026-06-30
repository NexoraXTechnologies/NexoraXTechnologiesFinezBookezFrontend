import { capitalizeFirstLttr } from "../utils/templateKeyLabel";

const Toggle = ({ arr, state, setState }: any) => {

    return (
        <div className="inline-flex p-1 bg-secondary border border-border rounded-md me-2">
            {arr?.map((e: any) => (
                <button
                    key={e}
                    onClick={() => setState(e)}
                    className={`px-5 py-1 text-sm rounded-md font-medium transition-all duration-300 ${state === e
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        }`}
                >
                    {capitalizeFirstLttr(e)}
                </button>
            ))}
        </div>
    );
};

export default Toggle;