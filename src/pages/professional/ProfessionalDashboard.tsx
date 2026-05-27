import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfessionalDashboardAnalytics } from '../../redux/slices/professionalSlice/dashboard/professionalDashboardSlice';
import AiTaxCopilotDrawer from './AiChat/AiTaxCopilotDrawer';
import AiChatBox from './AiChat/AiChatBox';
import ProQuickLinks from '../../components/professionalDashboard/ProQuickLinks';
import ProStatDonutChart from '../../components/professionalDashboard/ProStatDonutChart';
import ProAlertsList from '../../components/professionalDashboard/ProAlertsList';
import ProTrendLineChart from '../../components/professionalDashboard/ProTrendLineChart';
import ProDashboardCart from '../../components/professionalDashboard/ProDashboardCard';

const ProfessionalDashboard = () => {
  const dispatch = useDispatch();
  const [openChat, setOpenChat] = useState(false);
  const { analytics, loading, error } = useSelector((s) => s.professionalDashboard);

  const cards = useMemo(() => {
    return [
      {
        title: 'Total Taxpayers',
        value: analytics?.incomeTax?.totalTaxPayers ?? 0,
        stats: {
          active: analytics?.incomeTax?.active ?? 0,
          inactive: analytics?.incomeTax?.inactive ?? 0,
        },
        color: 'bg-[#E6F4FF]',
        delay: 0.05,
        icon: '👤',
      },
      {
        title: 'ITR',
        value: (analytics?.itr?.filedSuccessfully ?? 0) + (analytics?.itr?.draft ?? 0),
        stats: {
          filed: analytics?.itr?.filedSuccessfully ?? 0,
          draft: analytics?.itr?.draft ?? 0,
        },
        color: 'bg-[#EEF2FF]',
        delay: 0.1,
        icon: '📄',
      },
      {
        title: 'Tasks',
        value: analytics?.tasks?.total ?? 0,
        stats: {
          inProgress: analytics?.tasks?.inProgress ?? 0,
          partial: analytics?.tasks?.partiallyCompleted ?? 0,
          completed: analytics?.tasks?.completed ?? 0,
        },
        color: 'bg-[#ECFDF3]',
        delay: 0.15,
        icon: '✅',
      },
      {
        title: 'Documents',
        value: analytics?.documents?.total ?? 0,
        stats: {
          active: analytics?.documents?.active ?? 0,
          deleted: analytics?.documents?.deleted ?? 0,
        },
        color: 'bg-[#FFF7E6]',
        delay: 0.2,
        icon: '📁',
      },
      {
        title: 'Employees',
        value: analytics?.employees?.total ?? 0,
        stats: {
          active: analytics?.employees?.active ?? 0,
          inactive: analytics?.employees?.inactive ?? 0,
        },
        color: 'bg-[#FCE7F3]',
        delay: 0.25,
        icon: '👥',
      },
      {
        title: 'Masters',
        value: (analytics?.accountMaster?.total ?? 0) + (analytics?.productMaster?.total ?? 0),
        stats: {
          accounts: analytics?.accountMaster?.total ?? 0,
          products: analytics?.productMaster?.total ?? 0,
        },
        color: 'bg-[#F3F4F6]',
        delay: 0.3,
        icon: '📦',
      },
    ];
  }, [analytics]);

  const taskDonut = useMemo(() => {
    const t = analytics?.tasks || {};
    return [
      { name: 'In Progress', value: t.inProgress ?? 0 },
      { name: 'Partial', value: t.partiallyCompleted ?? 0 },
      { name: 'Completed', value: t.completed ?? 0 },
    ];
  }, [analytics]);

  const itrDonut = useMemo(() => {
    const i = analytics?.itr || {};
    return [
      { name: 'Filed', value: i.filedSuccessfully ?? 0 },
      { name: 'Draft', value: i.draft ?? 0 },
    ];
  }, [analytics]);

  const taxpayerDonut = useMemo(() => {
    const it = analytics?.incomeTax || {};
    return [
      { name: 'Active', value: it.active ?? 0 },
      { name: 'Inactive', value: it.inactive ?? 0 },
    ];
  }, [analytics]);

  const alerts = useMemo(() => [
    { type: 'warning', title: 'AIS review pending', description: 'Some taxpayers still need AIS verification.' },
    { type: 'danger', title: 'Due dates approaching', description: 'Filing deadlines are near for a few taxpayers.' },
    { type: 'info', title: 'Missing documents', description: 'Form 16 / 26AS upload missing for some clients.' },
  ], []);

  useEffect(() => {
    dispatch(fetchProfessionalDashboardAnalytics());
  }, [dispatch]);

  if (loading) return <p className="text-center mt-10 text-lg animate-pulse">Loading dashboard...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6 bg-gray-50 min-h-screen relative overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Professional Dashboard</h2>
          <p className="text-sm text-gray-500">Filing overview, compliance status, and workload summary.</p>
        </div>

        <ProQuickLinks
          links={[
            { label: 'Add Taxpayer', to: '/professional/incometax/addtaxpayer' },
            { label: 'File ITR', to: '/professional/incometax/fileitrlist' },
            // { label: 'Add Team/Employee', to: '/professional/users' },
          ]}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {cards.map((c) => <ProDashboardCart key={c.title} {...c} />)}
      </div>

      {/* Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <ProStatDonutChart title="Tasks Status" items={taskDonut} />
        <ProStatDonutChart title="ITR Status" items={itrDonut} />
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Alerts</h3>
            <span className="text-xs text-gray-500">Action needed</span>
          </div>
          <ProAlertsList items={alerts} />
        </div>
      </div>

      {/* Trend + Taxpayer Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-20">
        <div className="lg:col-span-2">
          <ProTrendLineChart
            title="Weekly ITR Activity"
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              filed: [1, 2, 1, 3, 2, 4, 3],
              draft: [2, 1, 2, 1, 3, 2, 1],
            }}
          />
        </div>
        <ProStatDonutChart title="Taxpayer Status" items={taxpayerDonut} />
      </div>

      {/* AI Floating Button */}
      <div className="fixed bottom-8 right-6 z-50">
        <AiChatBox onClick={() => setOpenChat(true)} />
      </div>

      {/* AI Drawer */}
      <AiTaxCopilotDrawer open={openChat} onClose={() => setOpenChat(false)} />
    </motion.div>
  );
};

export default ProfessionalDashboard;
