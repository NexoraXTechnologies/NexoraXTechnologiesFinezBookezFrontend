import { Boxes } from "lucide-react";

type CustomMasterCompProps = {
  name?: string;
  moduleCode?: string;
};

const CustomMasterComp = ({
  name = "Custom Master",
  moduleCode = "",
}: CustomMasterCompProps) => {
  return (
    <div className="p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Boxes size={22} />
          </span>

          <div>
            <h2 className="text-xl font-semibold capitalize text-slate-900">
              {name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Module Code: {moduleCode || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomMasterComp;