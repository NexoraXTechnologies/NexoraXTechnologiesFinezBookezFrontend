import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';

const AuthButton = (({ clickCb, loader }: any) => {
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            disabled={loader} onClick={clickCb}
            className={`w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all duration-200 ${loader ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            {loader ? 'Submitting...' : 'Send OTP'}
        </motion.button>
    )
})

const PaginationButton = ({ disabled, onClick, icon }: any) => {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="flex items-center justify-center w-10 h-10 cursor-pointer rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600">
            {icon}
        </button>
    )
}

const DataREfreshButton = (({ callBackFn }: any) => {
    return (
        <button onClick={callBackFn} className="h-11 w-11 cursor-pointer flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 active:scale-95">
            <RefreshCw size={18} />
        </button>
    )
});

const DataCreateButton = (({ callBackFn, text = "Add Account", icon }: { callBackFn: () => void, text?: string, icon?: React.ReactNode }) => {
    return (
        <button id="account-add-button" onClick={callBackFn} className="h-11 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-100 active:scale-95">
            {icon ? icon : <Plus size={18} />}
            <span>{text}</span>
        </button>
    )
});

const PrimaryButton = (({ callBackFn, text }: any) => {
    return (
        <button id="account-add-button" onClick={callBackFn} className="h-11 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-100 active:scale-95">
            {text}
        </button>
    )
});

const SecondaryButton = (({ callBackFn, text }: any) => {
    return (
        <button id="account-add-button" onClick={callBackFn} className="h-11 cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md bg-gray-200 text-gray-700 text-sm font-medium shadow shadow-indigo-500/20 transition-all duration-200 hover:bg-gray-300 hover:text-gray-800 hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-100 active:scale-95">
            {text}
        </button>
    )
});

export { AuthButton, PaginationButton, DataREfreshButton, DataCreateButton, PrimaryButton, SecondaryButton }