import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageComponentModal from "./PageComponentModal";
import Permission from "../PermissionGuard";

const TransactionDashboard = ({
  title,
  description,
  icon,
  cards,
}: any) => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard]: any = useState(null);
  const ActiveComponent = activeCard?.component;

  const handleCardClick = (card: any) => {
    if (card?.path) {
      navigate(card.path);
      return;
    }

    if (card?.component) {
      setActiveCard(card);
    }
  };

  return (
    <>
      <main className="min-h-full bg-background p-4 text-foreground sm:p-4">
        <section className="mb-4 rounded-md border border-border bg-card p-5 shadow-sm">
          <header className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </span>

            <span>
              <h1 className="text-2xl font-bold text-card-foreground">
                {title}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </span>
          </header>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card: any) =>{ 
         console.log(card?.permissionKey) 
          return(
            <Permission
              key={`${card?.moduleCode || card?.permissionKey}-${card?.title}`}
              module="bookez"
              permissionKey={card?.permissionKey}
              moduleCode={card?.moduleCode}
              action="view"
            >
              <article className="h-[112px]">
                <button
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className="
                                        group flex h-full w-full cursor-pointer items-center gap-4 rounded-md border border-border
                                        bg-card p-5 text-left shadow-sm transition-all duration-200
                                        hover:-translate-y-1 hover:border-primary hover:bg-muted hover:shadow-md
                                    "
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {card.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-card-foreground">
                      {card.title}
                    </span>

                    <span
                      className="mt-1 block overflow-hidden text-sm leading-5 text-muted-foreground"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {card.description}
                    </span>
                  </span>

                  <ArrowRight
                    size={18}
                    className="shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary"
                  />
                </button>
              </article>
            </Permission>
          )})}
        </section>
      </main>

      <PageComponentModal
        show={!!activeCard}
        title={activeCard?.title || ""}
        description={activeCard?.description}
        onClose={() => setActiveCard(null)}
      >
        {ActiveComponent && (
          <ActiveComponent
            {...(activeCard?.componentProps || {})}
          />
        )}
      </PageComponentModal>
    </>
  );
};

export default TransactionDashboard;