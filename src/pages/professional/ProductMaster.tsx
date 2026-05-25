import React, { useEffect, useState } from "react";
import { RefreshCcw, Trash2, Edit, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../components/common/ConfirmTooltip";

import {
	getAllProducts,
	createProduct,
	updateProduct,
	deleteProduct,
} from "../../redux/slices/professionalSlice/productMasterSlice";
import ReadMoreText from "../../components/common/ReadMoreText";
import SearchInput from "../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../components/buttons";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/pagination";
import Badge from "../../components/badge";

const ProductMaster = () => {
	const dispatch = useDispatch();

	const {
		products,
		pagination,
		loading,
		createLoading,
		updateLoading,
		deleteLoading,
	} = useSelector((s) => s.productMaster);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [refreshing, setRefreshing] = useState(false);
	const [showModal, setShowModal] = useState(false);

	const [editingProduct, setEditingProduct] = useState(null);

	const [errors, setErrors] = useState({});

	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		productCode: null,
	});

	const [form, setForm] = useState({
		productName: "",
		productDescription: "",
		productHSNCode: "",
		productType: "",
	});

	/* ============================================
		  FETCH PRODUCTS
	============================================= */
	const fetchProducts = () => {
		dispatch(
			getAllProducts({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
			})
		);
	};

	useEffect(() => {
		fetchProducts();
	}, [localOffset, localLimit, debouncedSearch]);

	/* ============================================
		  DEBOUNCE SEARCH
	============================================= */
	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setLocalOffset(0);
		}, 400);
		return () => clearTimeout(t);
	}, [search]);

	/* ============================================
		  REFRESH
	============================================= */
	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchProducts();
		toast.success("Product list refreshed");
		setRefreshing(false);
	};

	/* ============================================
		  OPEN ADD MODAL
	============================================= */
	const openAddModal = () => {
		setEditingProduct(null);

		setForm({
			productName: "",
			productDescription: "",
			productHSNCode: "",
			productType: "",
		});

		setShowModal(true);
	};

	/* ============================================
		  OPEN EDIT MODAL
	============================================= */
	const openEditModal = (p) => {
		setEditingProduct(p);

		setForm({
			productName: p.productName,
			productDescription: p.productDescription,
			productHSNCode: p.productHSNCode,
			productType: p.productType,
		});

		setShowModal(true);
	};

	/* ============================================
		  SAVE / UPDATE PRODUCT
	============================================= */
	const handleSubmit = async () => {
		const e = {};
		if (!form.productName.trim()) e.productName = "Product name required";
		if (!form.productHSNCode.trim()) e.productHSNCode = "HSN Code required";
		if (!form.productType.trim()) e.productType = "Product type required";
		setErrors(e);
		if (Object.keys(e).length > 0) return;

		try {
			if (editingProduct) {
				// Only send changed fields
				const updatePayload = {};

				const fields = ["productName", "productDescription", "productHSNCode", "productType"];
				fields.forEach((field) => {
					if (form[field] !== editingProduct[field]) {
						updatePayload[field] = form[field];
					}
				});

				await dispatch(
					updateProduct({
						productCode: editingProduct.productCode,
						data: updatePayload,
					})
				).unwrap();

				toast.success("Product updated successfully");
			} else {
				await dispatch(createProduct(form)).unwrap();
				toast.success("Product created");
			}

			setShowModal(false);
			fetchProducts();
		} catch (err) {
			toast.error(err.message || "Operation failed");
		}
	};

	/* ============================================
		  DELETE PRODUCT
	============================================= */
	const handleDeleteConfirm = async () => {
		try {
			await dispatch(deleteProduct(confirmTooltip.productCode)).unwrap();
			toast.success("Product deleted");
			fetchProducts();
		} finally {
			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				productCode: null,
			});
		}
	};

	/* ============================================
		  PAGINATION
	============================================= */
	const startIndex = pagination.totalDocs > 0 ? pagination.offset + 1 : 0;
	const endIndex = pagination.totalDocs > 0 ? pagination.offset + products.length : 0;

	return (
		<div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div id="product-header" className="flex items-center mb-3">

				<div id="product-summary" className="flex items-start gap-3">
					<Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Products:", varient: "primary" }} />
				</div>

				<div className="ml-auto flex items-center gap-2">
					<SearchInput {...{ search, setSearch }} />
					<DataREfreshButton {...{ callBackFn: handleRefresh }} />
					<DataCreateButton {...{ callBackFn: openAddModal }} />
				</div>
			</div>

			{/* ================= TABLE ================= */}
			<div className="flex-1 overflow-x-auto w-full">
				<div id="account-table-container" className="max-h-[78vh] overflow-auto rounded-md border border-gray-200 bg-white shadow-sm">
					<table className="min-w-full text-sm text-gray-700 border-separate border-spacing-0 pb-[2rem]">
						<thead className="sticky top-0 z-10 bg-white">
							<tr className="border-b border-gray-200">
								<th className="px-4 py-4 text-left font-semibold text-gray-600 w-[150px] bg-gray-50 border-b border-gray-200">Product Code</th>
								<th className="px-4 py-4 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Name</th>
								<th className="px-4 py-4 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">HSN Code</th>
								<th className="px-4 py-4 text-left font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">Description</th>
								<th className="px-4 py-4 text-left font-semibold text-gray-600 w-[120px] bg-gray-50 border-b border-gray-200">Actions</th>
							</tr>
						</thead>

						<tbody>
							{loading ? (
								<tr>
									<td
										colSpan={6}
										className="text-center py-10 text-gray-500"
									>
										<div className="flex flex-col items-center gap-2">
											<div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
											<span>Loading accounts...</span>
										</div>
									</td>
								</tr>
							) : products?.length ? (
								products.map((p) => (
									<tr key={p._id} className="hover:bg-indigo-50/40 transition-all duration-200">
										<td className="px-4 py-3 border-b border-gray-200 font-medium text-gray-800">{p.productCode}</td>
										<td className="px-4 py-3 border-b border-gray-200">{p.productName}</td>
										<td className="px-4 py-3 border-b border-gray-200">{p.productHSNCode}</td>
										<td className="px-4 py-3 border-b border-gray-200">
											<ReadMoreText
												text={p.productDescription}
												charLimit={20}
											/>
										</td>
										<td className="px-4 py-3 border-b border-gray-200">
											<button
												id="product-edit-button"
												onClick={() => openEditModal(p)}
												className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200"
											>
												<Edit size={16} />
											</button>
											<button
												id="product-delete-button"
												onClick={(e) => {
													const rect = e.currentTarget.getBoundingClientRect();
													let x = rect.left - 150;
													if (x < 10) x = 10;
													const y = rect.top + window.scrollY - 5;

													setConfirmTooltip({
														show: true,
														x,
														y,
														productCode: p.productCode,
													});
												}}
												className="p-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
											>
												<Trash2 size={16} />
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={5}
										className="text-center py-6 text-gray-500 italic"
									>
										<div className="flex flex-col items-center gap-2 text-sm text-gray-500">
											{debouncedSearch
												? `No products found for “${debouncedSearch}”.`
												: "No products found"}
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* ================= PAGINATION ================= */}

			{pagination.totalDocs > 0 && <Pagination  {...{
				localLimit, selectCb: (e) => {
					setLocalLimit(Number(e.target.value));
					setLocalOffset(0);
				},
				preDisabled: !pagination.hasPrevPage,
				nextDisabled: !pagination.hasNextPage,
				setLocalOffset, pagination
			}} />}

			{/* ================= DELETE TOOLTIP ================= */}
			{
				confirmTooltip.show && (
					<ConfirmTooltip
						x={confirmTooltip.x}
						y={confirmTooltip.y}
						message="Are you sure you want to delete this product?"
						confirmText="Delete"
						cancelText="Cancel"
						onConfirm={handleDeleteConfirm}
						onCancel={() =>
							setConfirmTooltip({
								show: false,
								x: null,
								y: null,
								productCode: null,
							})
						}
					/>
				)
			}

			{/* ================= MODAL ================= */}
			{
				showModal && (
					<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg shadow-lg w-[600px] max-w-[95vw] p-6 relative">
							<button
								onClick={() => setShowModal(false)}
								className="absolute top-3 right-3 text-gray-600 text-xl"
							>
								×
							</button>

							<h2 className="text-lg font-semibold mb-4">
								{editingProduct ? "Edit Product" : "Add New Product"}
							</h2>

							<div className="grid grid-cols-1 gap-4 text-sm">
								{/* Product Name */}
								<div className="flex flex-col">
									<label className="font-medium">Product Name *</label>
									<input
										type="text"
										value={form.productName}
										onChange={(e) =>
											setForm({ ...form, productName: e.target.value })
										}
										placeholder="Enter product name"
										required
										className={`border px-3 py-2 rounded ${errors.productName ? "border-red-500" : ""
											}`}
									/>
									{errors.productName && (
										<p className="text-red-500 text-xs mt-1">
											{errors.productName}
										</p>
									)}
								</div>
								<div className="flex flex-col">
									<label className="font-medium">Product Type *</label>
									<input
										type="text"
										value={form.productType}
										onChange={(e) =>
											setForm({ ...form, productType: e.target.value })
										}
										placeholder="Enter product type"
										required
										className={`border px-3 py-2 rounded ${errors.productType ? "border-red-500" : ""
											}`}
									/>
									{errors.productType && (
										<p className="text-red-500 text-xs mt-1">
											{errors.productType}
										</p>
									)}
								</div>

								{/* HSN Code */}
								<div className="flex flex-col">
									<label className="font-medium">HSN Code *</label>
									<input
										type="text"
										value={form.productHSNCode}
										onChange={(e) => {
											const val = e.target.value.replace(/[^0-9]/g, "");
											setForm({ ...form, productHSNCode: val });
										}}
										placeholder="Enter HSN code"
										required
										maxLength={8}
										className={`border px-3 py-2 rounded ${errors.productHSNCode ? "border-red-500" : ""
											}`}
									/>

									{errors.productHSNCode && (
										<p className="text-red-500 text-xs mt-1">
											{errors.productHSNCode}
										</p>
									)}
								</div>

								{/* Description */}
								<div className="flex flex-col">
									<label className="font-medium">Description</label>
									<textarea
										rows={3}
										value={form.productDescription}
										onChange={(e) =>
											setForm({ ...form, productDescription: e.target.value })
										}
										placeholder="Enter product description"
										className="border px-3 py-2 rounded resize-none"
									></textarea>
								</div>

								{/* Buttons */}
								<div className="flex justify-end gap-2 mt-2">
									<button
										onClick={() => setShowModal(false)}
										className="border px-4 py-2 rounded text-gray-700"
									>
										Cancel
									</button>

									<button
										onClick={handleSubmit}
										className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
									>
										{editingProduct ? "Update" : "Save"}
									</button>
								</div>
							</div>
						</div>
					</div>
				)
			}
		</div >
	);
};

export default ProductMaster;
