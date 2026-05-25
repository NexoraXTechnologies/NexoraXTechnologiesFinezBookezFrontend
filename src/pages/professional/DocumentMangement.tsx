import { useEffect, useState } from "react";
import { Trash2, Download, Upload } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
	getAllDocuments,
	uploadDocument,
	downloadDocument,
	deleteDocument,
} from "../../redux/slices/professionalSlice/professionalDocumentMgtSlice";
import { toast } from "react-toastify";
import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import SearchInput from "../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../components/buttons";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/pagination";
import Badge from "../../components/badge";

const columns = [
	{ key: 'name', title: 'Name', },
	{ key: 'ownerId', title: 'Owner ID' },
	{ key: 'mimeType', title: 'MIME Type', },
	{ key: 'uploadDate', title: 'Upload Date', type: "date" }
];

const DocumentMangement = () => {
	const dispatch = useDispatch();
	const { documents, loading, pagination, summary } = useSelector((s) => s.professionalDocumentMgt);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [fileInput, setFileInput] = useState(null);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Auto detect search field
	const searchType = /^\d+$/.test(debouncedSearch.trim()) ? "ownerId" : "name";
	const [confirmTooltip, setConfirmTooltip] = useState({ show: false, x: null, y: null, docId: null, });

	// Refresh
	const handleRefresh = async () => {
		setRefreshing(true);
		await dispatch(getAllDocuments({ page, limit, search: debouncedSearch.trim(), searchType }));
		setRefreshing(false);
		toast.success("Document list refreshed");
	};

	// Upload File
	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const formData = new FormData();
		formData.append("file", file);
		formData.append("name", file.name);
		formData.append("description", "Uploaded");
		formData.append("uploadDate", new Date().toISOString());

		try {
			await dispatch(uploadDocument(formData)).unwrap();
			toast.success('Upload successful');
			dispatch(getAllDocuments({ page, limit, search: debouncedSearch.trim(), searchType, }));
		} catch (err) {
			toast.error(err?.message || 'Upload failed');
		}
	};

	// Delete File
	const handleDeleteConfirm = async () => {
		try {
			await dispatch(deleteDocument(confirmTooltip.docId)).unwrap();
			toast.success("Document deleted");
			dispatch(getAllDocuments({ page, limit, search: debouncedSearch.trim(), searchType, }));
		} finally {
			setConfirmTooltip({ show: false, x: null, y: null, docId: null });
		}
	};

	// Load Documents
	useEffect(() => {
		dispatch(getAllDocuments({ page, limit, search: debouncedSearch.trim(), searchType, }));
	}, [dispatch, page, limit, debouncedSearch, searchType]);

	// Debounce search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, 500);

		return () => clearTimeout(handler);
	}, [search]);
	
	return (
		<div id="document-page-container" className="bg-white border-gray-200 shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= Header ================= */}
			<div className="flex items-center mb-3">
				{/* Left: summary cards */}
				<div id="document-summary-section" className="flex items-start gap-3">
					<Badge {...{ count: summary?.totalDocuments ?? 0, text: "Total Documents:", varient: "primary" }} />
					<Badge {...{ count: summary?.activeDocuments ?? 0, text: "Active Documents:" }} />
					<Badge {...{ count: summary?.totalDeletedDocuments ?? 0, text: "Deleted Documents:", varient: "danger" }} />
				</div>

				<div className="ml-auto flex items-center gap-2">
					<input
						type="file"
						ref={setFileInput}
						onChange={handleFileChange}
						className="hidden"
					/>
					<SearchInput {...{ search, setSearch }} />
					<DataREfreshButton {...{ callBackFn: handleRefresh }} />
					<DataCreateButton {...{ callBackFn: () => fileInput?.click(), text: "Upload", icon: <Upload size={16} /> }} />
				</div>
			</div>

			{/* ================= Table ================= */}
			<DataTable
				columns={columns}
				data={documents}
				loading={loading}
				emptyMessage="No products found"
				actions={(e) => (
					<div className="flex items-center gap-2">
						{/* EDIT */}
						<button
							id="document-download-button"
							onClick={() => dispatch(downloadDocument(doc.name))}
							className="text-blue-600 hover:text-blue-800"
						>
							<Download size={16} />
						</button>

						<button
							id="document-delete-button"
							onClick={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								const tooltipWidth = 130;
								let x = rect.left - tooltipWidth;
								if (x < 10) x = 10;
								const y = rect.top + window.scrollY - 5;

								setConfirmTooltip({
									show: true,
									x,
									y,
									docId: doc.id,
								});
							}}
							className="text-red-600 hover:text-red-800"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			{(summary?.totalDocuments && documents?.length > 0) > 0 && <Pagination  {...{
				localLimit: limit, selectCb: (e) => {
					setLimit(Number(e.target.value));
					setPage(1);
				},
				preDisabled: pagination?.currentPage === 1,
				nextDisabled: pagination?.currentPage === pagination?.totalPages,
				setLocalOffset: setPage, pagination
			}} />}

			{/* ================= Delete Tooltip ================= */}
			{confirmTooltip.show && (
				<ConfirmTooltip
					x={confirmTooltip.x}
					y={confirmTooltip.y}
					message="Are you sure you want to delete this document?"
					confirmText="Delete"
					cancelText="Cancel"
					onConfirm={handleDeleteConfirm}
					onCancel={() =>
						setConfirmTooltip({
							show: false,
							x: null,
							y: null,
							docId: null,
						})
					}
				/>
			)}
		</div>
	);
};

export default DocumentMangement;