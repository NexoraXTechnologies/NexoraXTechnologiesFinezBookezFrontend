import { motion } from 'framer-motion';

const ProDashboardCard = ({ title, value, stats, color = 'bg-white', delay = 0, icon, footerText }: any) => (
  <>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Accent Line */}
      <div className="h-1 bg-blue-500" />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-3">{value}</h2>
          </div>

          {/* Icon */}
          <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
            <span className="text-xl">{icon}</span>
          </div>
        </div>
        <div className="mt-3 text-xs flex flex-wrap gap-3 text-gray-600">
          {Object.entries(stats).map(([key, val]) => (
            <span key={key} className="capitalize">
              {key}: <span className="font-semibold text-gray-900">{val}</span>
            </span>
          ))}
        </div>

      </div>
    </motion.div>


    {/* <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay }} whileHover={{ scale: 1.03 }} className={`p-5 rounded-xl shadow-sm border border-gray-100 text-gray-800 ${color}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
        </div>

        {icon && (
          <div className="h-10 w-10 rounded-lg bg-white/60 flex items-center justify-center border border-gray-200">
            <span className="text-xl">{icon}</span>
          </div>
        )}
      </div>

      {stats && (
        <div className="mt-3 text-xs flex flex-wrap gap-3 text-gray-600">
          {Object.entries(stats).map(([key, val]) => (
            <span key={key} className="capitalize">
              {key}: <span className="font-semibold text-gray-900">{val}</span>
            </span>
          ))}
        </div>
      )}

      {footerText && <p className="text-xs mt-3 text-gray-500">{footerText}</p>}
    </motion.div> */}
  </>

);

export default ProDashboardCard;
