import { AnimatePresence, motion } from "framer-motion";
import AiTaxCopilot from "./AiTaxCopilot";

const AiTaxCopilotDrawer = ({ open, onClose }: any) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Soft backdrop */}
          <motion.div
            className="
              fixed inset-0 z-[80]
              bg-slate-950/25 backdrop-blur-[3px]
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Popup position wrapper */}
          <motion.div
            className="
              fixed z-[90]

              /* Desktop popup */
              bottom-5 right-5
              h-[min(720px,calc(100vh-40px))]
              w-[min(470px,calc(100vw-40px))]

              /* Mobile full screen */
              max-sm:bottom-0 max-sm:right-0
              max-sm:h-[100dvh] max-sm:w-full
            "
            initial={{
              opacity: 0,
              y: 34,
              scale: 0.94,
              filter: "blur(6px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              y: 28,
              scale: 0.96,
              filter: "blur(4px)",
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 26,
              mass: 0.8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow behind popup */}
            <div
              className="
                pointer-events-none absolute -inset-3 -z-10
                rounded-[2rem]
                bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-cyan-400/20
                blur-2xl
                max-sm:hidden
              "
            />

            {/* Main popup shell */}
            <div
              className="
                relative flex h-full flex-col overflow-hidden

                rounded-[1.75rem]
                border border-white/70
                bg-white
                shadow-[0_30px_100px_rgba(15,23,42,0.30)]

                ring-1 ring-slate-900/5

                max-sm:rounded-none
                max-sm:border-0
                max-sm:shadow-none
              "
            >
              {/* Top small handle for mobile */}
              <div className="hidden max-sm:flex h-5 shrink-0 items-center justify-center bg-white">
                <span className="h-1 w-10 rounded-full bg-slate-300" />
              </div>

              <AiTaxCopilot onClose={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AiTaxCopilotDrawer;