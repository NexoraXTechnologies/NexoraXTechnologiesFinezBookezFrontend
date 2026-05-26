import React, { useEffect, useState } from "react";
import { RefreshCcw, Trash2, Edit, Download, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import {
  getAllTasks,
  softDeleteTask,
  createTask,
  updateTask,
} from "../../redux/slices/professionalSlice/professionalTaskManagementSlice";

import { getProfessionalUsers } from "../../redux/slices/professionalSlice/professionalUserSlice";
import ReadMoreText from "../../components/common/ReadMoreText";
import {
  uploadDocument,
  downloadDocument,
} from "../../redux/slices/professionalSlice/professionalDocumentMgtSlice";
import DataTable from "../../components/DataTable";
import SearchInput from "../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../components/buttons";

const TaskManagement = () => {
  const dispatch = useDispatch();
  const { tasks, page, limit, totalCount, totalPages, loading } = useSelector(
    (s) => s.professionalTaskMgt
  );
  const { users } = useSelector((s) => s.professionalUser || {});
  const professionalHeaders = JSON.parse(
    localStorage.getItem("professionalHeaders")
  );
  const professionalUser = JSON.parse(localStorage.getItem("professionalUser"));

  const canCreate =
    professionalHeaders?.["x-db-name"] === professionalHeaders?.loginuser;

  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [errors, setErrors] = useState({});
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentInfo, setAttachmentInfo] = useState(null);

  const [confirmTooltip, setConfirmTooltip] = useState({
    show: false,
    x: null,
    y: null,
    taskId: null,
  });

  // NEW: completion & history
  const [completion, setCompletion] = useState("");
  const [taskCompletionList, setTaskCompletionList] = useState([]);

  const buildTaskParams = () => {
    return {
      page: localPage,
      limit: localLimit,
      search: debouncedSearch,
      ...(canCreate
        ? {}
        : { taskAssignedToMobile: professionalHeaders?.loginuser }),
    };
  };

  // Form state for add/edit
  const [form, setForm] = useState({
    taskName: "",
    projectName: "",
    taskDetails: "",
    attachement: null,
    taskCompletionDate: "",
    taskPriority: "",
    taskAssignedTo: "",
    taskAssignedToMobile: "",
    taskStatus: "Open",
    taskRemarks: "",
  });

  // Fetch tasks & users
  useEffect(() => {
    dispatch(getAllTasks(buildTaskParams()));
    dispatch(getProfessionalUsers());
  }, [dispatch, localPage, localLimit, debouncedSearch, canCreate]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setLocalPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(getAllTasks(buildTaskParams()));
    setRefreshing(false);
    toast.success("Task list refreshed");
  };

  const openAddModal = () => {
    setEditingTask(null);
    setForm({
      taskName: "",
      projectName: "",
      taskDetails: "",
      attachement: null,
      taskCompletionDate: "",
      taskPriority: "",
      taskStatus: "Open",
      taskAssignedTo: "",
      taskAssignedToMobile: "",
      taskRemarks: "",
    });

    // clear attachment + completion state
    setAttachmentInfo(null);
    setCompletion("");
    setTaskCompletionList([]);

    setShowModal(true);
    setErrors({});
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    const assignedUser = users?.find(
      (u) =>
        String(u.userMobileNumberHash) === String(task.taskAssignedToMobile)
    );

    const assignedName = assignedUser
      ? [
        assignedUser.userFirstName,
        assignedUser.userMiddleName,
        assignedUser.userLastName,
      ]
        .map((part) => (part || "").trim())
        .filter(Boolean)
        .join(" ")
      : task.taskAssignedTo || "";

    setEditingTask(task);

    setForm({
      taskName: task.taskName || "",
      projectName: task.projectName || "",
      taskDetails: task.taskDetails || "",
      attachement: task.attachement || null,
      taskCompletionDate: task.taskCompletionDate || "",
      taskPriority: task.taskPriority,
      taskAssignedTo: task.taskAssignedTo,
      taskAssignedToMobile: task.taskAssignedToMobile,
      taskStatus: task.taskStatus,
      taskRemarks: task.taskRemarks || task.remark || "",
    });

    setAttachmentInfo(task.attachement || null);

    // NEW: init completion & history
    setCompletion(
      task.taskCompletionPercentage != null
        ? String(task.taskCompletionPercentage)
        : ""
    );
    setTaskCompletionList(task.taskCompletionPercentageDetails || []);

    setShowModal(true);
    setErrors({});
  };

  // SAVE / UPDATE TASK
  const handleSubmit = async () => {
    try {
      let uploadedDoc = null;

      // Upload only if a REAL file exists
      if (form.attachement instanceof File) {
        const fd = new FormData();
        fd.append("file", form.attachement);
        fd.append("name", form.attachement.name);
        fd.append("description", "Uploaded");
        fd.append("uploadDate", new Date().toISOString());
        fd.append("tags[]", "KBTAG-000011");
        uploadedDoc = await dispatch(uploadDocument(fd)).unwrap();
      }

      let payload = {
        ...form,
        taskAssignedTo: form.taskAssignedTo,
        taskAssignedToMobile: form.taskAssignedToMobile,
        attachement: uploadedDoc ? uploadedDoc : attachmentInfo || null,
      };

      if (editingTask) {
        // EDIT MODE

        if (canCreate) {
          // Parent (creator) editing – keep completion / history as is
          payload.taskCompletionPercentage =
            editingTask.taskCompletionPercentage ?? null;
          payload.taskCompletionPercentageDetails =
            editingTask.taskCompletionPercentageDetails || [];
          payload.remark =
            editingTask.remark ??
            editingTask.taskRemarks ??
            form.taskRemarks ??
            "";
        } else {
          // Assigned user editing – can change status, remark, completion
          const prevCompletion = Number(
            editingTask.taskCompletionPercentage || 0
          );
          const prevRemark = String(
            editingTask.remark ?? editingTask.taskRemarks ?? ""
          ).trim();

          const newCompletion =
            completion !== ""
              ? String(completion)
              : String(prevCompletion || "");
          const newRemark = String(form.taskRemarks || "").trim();

          let updatedCompletionList = [...taskCompletionList];

          if (
            String(prevCompletion || "") !== String(newCompletion || "") ||
            prevRemark !== newRemark
          ) {
            const newEntry = {
              taskCompletionPercentage: newCompletion,
              taskCompletionPercentageDetails: newRemark,
              updatedOn: new Date().toISOString(),
            };
            updatedCompletionList = [newEntry, ...taskCompletionList];
          }

          payload.taskCompletionPercentage = newCompletion;
          payload.taskCompletionPercentageDetails = updatedCompletionList;
          payload.taskStatus = form.taskStatus;
          payload.remark = newRemark;
          // keep also taskRemarks for compatibility
          payload.taskRemarks = newRemark;
        }

        await dispatch(
          updateTask({ taskId: editingTask.taskId, data: payload })
        ).unwrap();
        toast.success("Task updated successfully");
      } else {
        // CREATE MODE
        payload.taskStatus = "Open";
        await dispatch(createTask(payload)).unwrap();
        toast.success("Task added successfully");
      }

      setShowModal(false);
      setAttachmentInfo(null);
      setCompletion("");
      setTaskCompletionList([]);

      dispatch(getAllTasks(buildTaskParams()));
    } catch (err) {
      toast.error(err.message || "Operation failed");
    }
  };

  // Delete confirm
  const handleDeleteConfirm = async () => {
    try {
      await dispatch(softDeleteTask(confirmTooltip.taskId)).unwrap();
      toast.success("Task deleted");
      dispatch(getAllTasks(buildTaskParams()));
    } finally {
      setConfirmTooltip({ show: false, x: null, y: null, taskId: null });
    }
  };

  // Pagination math
  const offset =
    (page ?? localPage) > 0
      ? ((page ?? localPage) - 1) * (limit ?? localLimit)
      : 0;
  const startIndex = totalCount > 0 ? offset + 1 : 0;
  const endIndex = totalCount > 0 ? offset + (tasks?.length || 0) : 0;
  const today = new Date().toISOString().split("T")[0];

  const toDateInputFormat = (isoString) => {
    const d = new Date(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateDDMMYYYY = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);

    const pad = (n) => (n < 10 ? "0" + n : n);

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const columns = [
    {
      key: 'taskId',
      title: 'Task ID',
    },
    {
      key: 'taskName',
      title: 'Task Name',
      type:'readMoreText'
    },
    {
      key: 'projectName',
      title: 'Project',
      type: 'readMoreText'
    },
    {
      key: 'taskAssignedTo',
      title: 'Assigned To',
    },
    {
      key: 'taskPriority',
      title: 'Priority'
    },
    {
      key: 'createdOn',
      title: 'Assign Date',
      type: "date"
    },
    {
      key: 'taskCompletionDate',
      title: 'Due Date',
      type: "date"
    },
    {
      key: 'taskStatus',
      title: 'Status',
    }
  ];

  return (
    <div id="task-header" className="w-full bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-8">
            <span className="text-xs text-gray-600">Total Tasks:</span>
            <span className="text-sm font-semibold text-blue-700">{totalCount ?? 0}</span>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput {...{ search, setSearch }} />
          <DataREfreshButton {...{ callBackFn: handleRefresh }} />
          <DataCreateButton {...{ callBackFn: openAddModal, text:"Add Task" }} />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={tasks}
        loading={loading}
        emptyMessage="No Task Created"
        actions={(e) => (
          <div className="flex items-center gap-2">
            {/* EDIT */}
            <button id="task-edit-button" onClick={() => openEditModal(t)} className="text-blue-600 hover:text-blue-800" title="Edit">
              <Edit size={16} />
            </button>

            {canCreate && (
              <button
                id="task-delete-button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const tooltipWidth = 150;
                  let x = rect.left - tooltipWidth;
                  if (x < 10) x = 10;
                  const y = rect.top + window.scrollY - 5;

                  setConfirmTooltip({
                    show: true,
                    x,
                    y,
                    taskId: t.taskId,
                  });
                }}
                className="text-red-600 hover:text-red-800"
                title="Delete">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      />
      

      {/* Pagination */}
      {totalCount > 0 && (
        <div id="task-pagination" className="flex justify-between items-center mt-4 text-sm text-gray-700 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-gray-600">
              Rows per page:
            </label>
            <select
              id="limit"
              value={localLimit}
              onChange={(e) => {
                setLocalLimit(Number(e.target.value));
                setLocalPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              {[10, 20, 50, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            Showing{' '}
            <strong>
              {startIndex}–{endIndex}
            </strong>{' '}
            of <strong>{totalCount}</strong> | Page <strong>{page ?? localPage}</strong> of <strong>{totalPages ?? 1}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setLocalPage(1)} disabled={(page ?? localPage) === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              First
            </button>
            <button onClick={() => setLocalPage((p) => Math.max(1, p - 1))} disabled={(page ?? localPage) === 1} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Prev
            </button>
            <button
              onClick={() => setLocalPage((p) => Math.min((page ?? p) + 1, totalPages ?? p + 1))}
              disabled={(page ?? localPage) === (totalPages ?? 1)}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Next
            </button>
            <button onClick={() => setLocalPage(totalPages ?? 1)} disabled={(page ?? localPage) === (totalPages ?? 1)} className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50">
              Last
            </button>
          </div>
        </div>
      )}

      {/* Delete Tooltip */}
      {confirmTooltip.show && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message="Are you sure you want to delete this task?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, taskId: null })}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[800px] max-w-[95vw] p-6 relative overflow-y-auto max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false);
                setAttachmentInfo(null);
                setCompletion('');
                setTaskCompletionList([]);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close">
              &times;
            </button>

            <h2 className="text-lg font-semibold mb-4">{editingTask ? 'Edit Task' : 'Add New Task'}</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newErrors = {};

                if (!form.taskName.trim()) newErrors.taskName = 'Task name is required.';
                if (!form.taskCompletionDate) newErrors.taskCompletionDate = 'Due date is required.';
                if (!form.taskAssignedToMobile) newErrors.taskAssignedToMobile = 'Please assign a user.';

                // Extra validation for assigned user (non-parent) in edit mode
                if (editingTask && !canCreate) {
                  if (!form.taskRemarks?.trim()) {
                    newErrors.taskRemarks = 'Remark is required.';
                  }

                  const prev = Number(editingTask.taskCompletionPercentage || 0);
                  if (completion && Number(completion || 0) < Number(prev || 0)) {
                    newErrors.completion = 'Completion percentage cannot be less than previous value.';
                  }
                }

                setErrors(newErrors);

                if (Object.keys(newErrors).length === 0) {
                  handleSubmit();
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Task Name */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.taskName}
                  onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                  className={`border rounded-md px-3 py-2 ${errors?.taskName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter task name"
                  disabled={!canCreate}
                />
                {errors?.taskName && <p className="text-xs text-red-500 mt-1">{errors.taskName}</p>}
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Project Name */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter project name"
                  disabled={!canCreate}
                />
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Task Details */}
              <div className="flex flex-col col-span-2">
                <label className="font-medium text-gray-700 mb-1">Task Details</label>
                <textarea
                  value={form.taskDetails}
                  onChange={(e) => setForm({ ...form, taskDetails: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 resize-none"
                  rows={3}
                  placeholder="Enter task details"
                  disabled={!canCreate}
                />
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Attachment */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">Attachment</label>

                {/* Existing attachment preview when editing */}
                {attachmentInfo ? (
                  <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50">
                    <span className="text-sm truncate max-w-[200px]">{attachmentInfo.name}</span>

                    <div className="flex items-center gap-3">
                      {/* Download Icon */}
                      <button type="button" onClick={() => dispatch(downloadDocument(attachmentInfo.name))} className="text-blue-600 hover:text-blue-800" title="Download">
                        <Download size={16} />
                      </button>

                      {/* Delete Icon */}
                      {canCreate && (
                        <button type="button" onClick={() => setAttachmentInfo(null)} className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ONLY show file input if NO attachment */
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const preview = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      };

                      setAttachmentInfo(preview);
                      setForm({ ...form, attachement: file });
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2"
                    disabled={!canCreate}
                  />
                )}
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Due Date */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={form.taskCompletionDate ? toDateInputFormat(form.taskCompletionDate) : ''}
                  min={today}
                  onChange={(e) => {
                    const selectedDate = e.target.value; // YYYY-MM-DD

                    const now = new Date(); // current time
                    const [year, month, day] = selectedDate.split('-');

                    const finalDate = new Date(Number(year), Number(month) - 1, Number(day), now.getHours(), now.getMinutes(), now.getSeconds());

                    setForm({
                      ...form,
                      taskCompletionDate: finalDate.toISOString(),
                    });
                  }}
                  className={`border rounded-md px-3 py-2 ${errors?.taskCompletionDate ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={!canCreate}
                />

                {errors?.taskCompletionDate && <p className="text-xs text-red-500 mt-1">{errors.taskCompletionDate}</p>}
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Priority */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.taskPriority} onChange={(e) => setForm({ ...form, taskPriority: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2" disabled={!canCreate}>
                  <option value="">Select</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Task Status */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">
                  Task Status <span className="text-red-500">*</span>
                </label>

                <select value={form.taskStatus} onChange={(e) => setForm({ ...form, taskStatus: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2" disabled={canCreate}>
                  <option value="">Select</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Partially Completed">Partially Completed</option>
                  <option value="Completed">Completed</option>
                </select>

                {canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed to change task status.</p>}
              </div>

              {/* Assigned To */}
              <div className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">
                  Assigned To <span className="text-red-500">*</span>
                </label>

                <select
                  disabled={!canCreate}
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={form.taskAssignedToMobile || ''}
                  onChange={(e) => {
                    const selectedMobile = e.target.value;

                    const user = users?.find((u) => String(u.userMobileNumberHash) === String(selectedMobile));
                    if (!user) return;

                    const fullName = [user.userFirstName, user.userMiddleName, user.userLastName]
                      .map((part) => (part || '').trim())
                      .filter(Boolean)
                      .join(' ');

                    setForm((prev) => ({
                      ...prev,
                      taskAssignedTo: fullName,
                      taskAssignedToMobile: selectedMobile,
                    }));
                  }}>
                  <option value="">Select Assigned User</option>

                  {users?.map((u) => {
                    const fullName = [u.userFirstName, u.userMiddleName, u.userLastName].filter(Boolean).join(' ');

                    return (
                      <option key={u.userMobileNumberHash} value={u.userMobileNumberHash}>
                        {fullName}
                      </option>
                    );
                  })}
                </select>

                {errors?.taskAssignedToMobile && <p className="text-xs text-red-500 mt-1">{errors.taskAssignedToMobile}</p>}
                {!canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed Change.</p>}
              </div>

              {/* Completion % (only in edit) */}
              {editingTask && (
                <div className="flex flex-col">
                  <label className="font-medium text-gray-700 mb-1">Completion %</label>
                  <select value={completion} onChange={(e) => setCompletion(e.target.value)} disabled={canCreate} className={`border rounded-md px-3 py-2 ${errors?.completion ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select</option>
                    {Array.from({ length: 20 }, (_, i) => (i + 1) * 5).map((v) => (
                      <option key={v} value={v}>
                        {v}%
                      </option>
                    ))}
                  </select>
                  {errors?.completion && <p className="text-xs text-red-500 mt-1">{errors.completion}</p>}
                  {canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed to change completion percentage.</p>}
                </div>
              )}

              {/* Remarks (Only on Edit) */}
              {editingTask && (
                <div className="flex flex-col col-span-2">
                  <label className="font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={form.taskRemarks || ''}
                    onChange={(e) => setForm({ ...form, taskRemarks: e.target.value })}
                    className={`border rounded-md px-3 py-2 resize-none ${errors?.taskRemarks ? 'border-red-500' : 'border-gray-300'}`}
                    rows={2}
                    placeholder="Enter remarks for this task"
                    disabled={canCreate}
                  />
                  {errors?.taskRemarks && <p className="text-xs text-red-500 mt-1">{errors.taskRemarks}</p>}
                  {canCreate && <p className="text-xs text-gray-500 mt-1">You are not allowed to Remark.</p>}
                </div>
              )}

              {/* Completion History Cards */}
              {editingTask && (
                <div className="col-span-2 mt-2">
                  {taskCompletionList && taskCompletionList.length > 0 ? (
                    taskCompletionList.map((item, index) => (
                      <div key={index} className="border border-gray-300 rounded-md p-3 mb-2 bg-gray-50">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-semibold text-gray-800">{item.taskCompletionPercentage}% Completed</p>
                          {!canCreate && (
                            <button type="button" onClick={() => setTaskCompletionList((prev) => prev.filter((_, i) => i !== index))} className="text-red-600 hover:text-red-800 text-xs">
                              Delete
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Remark: </span>
                          {item.taskCompletionPercentageDetails || '—'}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">Updated On: </span>
                          {item.updatedOn ? new Date(item.updatedOn).toLocaleString() : '—'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic text-center mt-2">No completion updates yet.</p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setAttachmentInfo(null);
                    setCompletion('');
                    setTaskCompletionList([]);
                  }}
                  className="border px-4 py-2 rounded-md text-gray-700">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  {editingTask ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
