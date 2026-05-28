// import { ReactNode } from "react";
// import { useNavigate } from "react-router-dom";
// import { ArrowRight } from "lucide-react";

// export type DashboardCard = {
//   title: string;
//   description: string;
//   path: string;
//   icon: ReactNode;
// };

// type TransactionDashboardProps = {
//   title: string;
//   description: string;
//   icon: ReactNode;
//   cards: DashboardCard[];
// };

// const TransactionDashboard = ({
//   title,
//   description,
//   icon,
//   cards,
// }: TransactionDashboardProps) => {
//   const navigate = useNavigate();

//   return (
//     <main className="p-4 sm:p-6">
//       <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//         <header className="flex items-center gap-3">
//           <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//             {icon}
//           </span>

//           <span>
//             <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
//             <p className="mt-1 text-sm text-slate-500">{description}</p>
//           </span>
//         </header>
//       </section>

//       <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
//         {cards.map((card) => (
//           <article
//             key={card.title}
//             onClick={() => navigate(card.path)}
//             className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
//           >
//             <button
//               type="button"
//               className="flex w-full items-start justify-between gap-4 text-left"
//             >
//               <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//                 {card.icon}
//               </span>

//               <ArrowRight
//                 size={18}
//                 className="text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-indigo-600"
//               />
//             </button>

//             <h2 className="mt-4 text-base font-semibold text-slate-900">
//               {card.title}
//             </h2>

//             <p className="mt-1 text-sm leading-5 text-slate-500">
//               {card.description}
//             </p>
//           </article>
//         ))}
//       </section>
//     </main>
//   );
// };

// export default TransactionDashboard;




import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export type DashboardCard = {
  title: string;
  description: string;
  path: string;
  icon: ReactNode;
};

type TransactionDashboardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  cards: DashboardCard[];
};

const TransactionDashboard = ({
  title,
  description,
  icon,
  cards,
}: TransactionDashboardProps) => {
  const navigate = useNavigate();

  return (
    <main className="p-4 sm:p-6">
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </span>

          <span>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </span>
        </header>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title}>
            <button
              type="button"
              onClick={() => navigate(card.path)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {card.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-slate-900">
                  {card.title}
                </span>

                <span className="mt-1 block text-sm leading-5 text-slate-500">
                  {card.description}
                </span>
              </span>

              <ArrowRight
                size={18}
                className="shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-indigo-600"
              />
            </button>
          </article>
        ))}
      </section>
    </main>
  );
};

export default TransactionDashboard;