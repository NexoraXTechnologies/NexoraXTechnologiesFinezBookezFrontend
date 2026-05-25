import React, { useEffect, useState } from "react";
import { RefreshCcw, Trash2, Download, Upload } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from "../../redux/slices/professionalSlice/professionalDocumentMgtSlice";
import { toast } from "react-toastify";
import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import ReadMoreText from "../../components/common/ReadMoreText"
import SearchInput from "../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../components/buttons";
import DataTable from "../../components/DataTable";
const DocumentMangement = () => {
  const dispatch = useDispatch();
  const { documents, loading, pagination, summary } = useSelector(
    (s) => s.professionalDocumentMgt
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [fileInput, setFileInput] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Auto detect search field
  const searchType = /^\d+$/.test(debouncedSearch.trim()) ? "ownerId" : "name";

  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    docId: null,
  });

  // ==================================================
  // Load Documents
  // ==================================================
  useEffect(() => {
    dispatch(
      getAllDocuments({
        page,
        limit,
        search: debouncedSearch.trim(),
        searchType,
      })
    );
  }, [dispatch, page, limit, debouncedSearch, searchType]);

  // ==================================================
  // Debounce search
  // ==================================================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // ==================================================
  // Refresh
  // ==================================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(
      getAllDocuments({
        page,
        limit,
        search: debouncedSearch.trim(),
        searchType,
      })
    );
    setRefreshing(false);
    toast.success("Document list refreshed");
  };

  // ==================================================
  // Upload File
  // ==================================================
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

      dispatch(
        getAllDocuments({
          page,
          limit,
          search: debouncedSearch.trim(),
          searchType,
        }),
      );
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    }
  };

  // ==================================================
  // Delete File
  // ==================================================
  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteDocument(confirmTooltip.docId)).unwrap();
      toast.success("Document deleted");
      dispatch(
        getAllDocuments({
          page,
          limit,
          search: debouncedSearch.trim(),
          searchType,
        })
      );
    } finally {
      setConfirmTooltip({ show: false, x: null, y: null, docId: null });
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Name',
    },
    {
      key: 'ownerId',
      title: 'Owner ID',
    },
    {
      key: 'mimeType',
      title: 'MIME Type',
    },
    {
      key: 'description',
      title: 'Upload Date',
    }
  ];

  return (
    <div id="document-page-container" className="bg-white border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-[85vh]">
      {/* ================= Header ================= */}
      <div className="flex items-center mb-3">
        {/* Left: summary cards */}
        <div id="document-summary-section" className="flex items-start gap-3">
          <div id="summary-total-documents" className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Total Documents:</span>
            <span className="text-sm font-semibold text-blue-700">
              {summary?.totalDocuments ?? 0}
            </span>
          </div>

          <div id="summary-active-documents" className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Active Documents:</span>
            <span className="text-sm font-semibold text-green-700">
              {summary?.activeDocuments ?? 0}
            </span>
          </div>

          <div id="summary-deleted-documents" className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Deleted Documents:</span>
            <span className="text-sm font-semibold text-red-700">
              {summary?.totalDeletedDocuments ?? 0}
            </span>
          </div>
        </div>

        {/* Right: controls */}
        {/* <div className="ml-auto flex items-center gap-2">
          <input
            id="document-search-input"
            type="text"
            placeholder="Search documents..."
            className="border px-3 py-2 h-9 rounded-md w-64 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            id="document-upload-button"
            onClick={() => fileInput?.click()}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 h-9 rounded-md hover:bg-blue-700"
          >
            <Upload size={16} /> Upload
          </button>



          <button
            id="task-refresh-button"
            onClick={handleRefresh}
            className="border px-3 h-9 rounded-md flex items-center justify-center hover:bg-gray-100"
          >
            <RefreshCcw
              size={16}
              className={refreshing ? "animate-spin text-blue-600" : ""}
            />
          </button>
        </div> */}

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
      <div className="flex-1 w-full">
        <div className="max-h-[78vh] overflow-y-auto border rounded-md">
          <table className="min-w-full table-fixed text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                {/* <th className="px-3 py-2 text-left">Description</th> */}
                <th className="px-3 py-2 text-left">Owner ID</th>
                <th className="px-3 py-2 text-left">MIME Type</th>
                <th className="px-3 py-2 text-left">Upload Date</th>
                <th className="px-3 py-2 text-center w-[90px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {documents?.length ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{doc.name}</td>
                    {/* <td className="px-3 py-2"> <ReadMoreText text={doc.description} charLimit={20} /></td> */}
                    <td className="px-3 py-2">{doc.ownerId}</td>
                    <td className="px-3 py-2">{doc.mimeType}</td>
                    <td className="px-3 py-2">
                      {new Date(doc.uploadDate).toLocaleString()}
                    </td>

                    <td className="px-3 py-2 flex items-center gap-3 justify-center">
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found"
        actions={(e) => (
          <div className="flex items-center gap-2">
            {/* EDIT */}
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
          </div>
        )}
      />
      {/* ================= Pagination ================= */}
      {(summary?.totalDocuments && documents?.length > 0) > 0 && (
        <div id="documentation-pagination" className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Rows per page:</label>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              {[10, 20, 50, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Showing info */}
          <div>
            Showing{" "}
            <strong>
              {pagination?.offset + 1}–
              {Math.min(pagination?.offset + pagination?.limit, summary?.totalDocuments)}
            </strong>{" "}
            of <strong>{summary?.totalDocuments}</strong> | Page{" "}
            <strong>{pagination?.currentPage}</strong> of{" "}
            <strong>{pagination?.totalPages}</strong>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={pagination?.currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              First
            </button>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination?.currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Prev
            </button>

            <button
              onClick={() =>
                setPage((p) => Math.min(p + 1, pagination?.totalPages))
              }
              disabled={pagination?.currentPage === pagination?.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>

            <button
              onClick={() => setPage(pagination?.totalPages)}
              disabled={pagination?.currentPage === pagination?.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}

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
