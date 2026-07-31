import { useEffect, useState } from "react";
import { Trash2, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductMasterSchema,
} from "../../../../redux/slices/professionalSlice/productMasterSlice";

import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import Badge from "../../../../components/badge";
import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";

import ProductMasterFormModal from "./ProductMasterFormModal";
import { getHSNCode } from "../../../../redux/slices/professionalSlice/hsnCode";
import Permission from "../../../../components/PermissionGuard";

const ProductMaster = () => {
  const dispatch = useDispatch();

  const {
    products,
    pagination,
    loading,
    productMasterSchemaFields = [],
    schemaLoading,
  } = useSelector((s: any) => s.productMaster);
  const { units = [] } = useSelector((s: any) => s.unitMaster || {});
  const { HSNCode } = useSelector((s: any) => s.HSNCode || {});
  const [localOffset, setLocalOffset] = useState(0);
  const [localLimit, setLocalLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [customeField, setCustomeField] = useState<any>([]);
  const [confirmTooltip, setConfirmTooltip] = useState<any>({
    show: false,
    x: null,
    y: null,
    productCode: null,
  });

  /* =====================================================
     FETCH PRODUCT MASTER SCHEMA
  ===================================================== */
  useEffect(() => {
    dispatch(
      getAllProductMasterSchema({
        offset: 0,
        limit: 50,
      }) as any
    );
  }, [dispatch]);

  /* =====================================================
     FETCH UNITS
  ===================================================== */
  useEffect(() => {
    dispatch(
      getAllUnits({
        offset: 0,
        limit: 1000,
        search: "",
      }) as any
    );
  }, [dispatch]);

  /* =====================================================
     NORMALIZE PRODUCT TYPE FOR TABLE DISPLAY
  ===================================================== */
  const normalizeProductType = (value = "") => {
    const map: any = {
      rawmaterial: "Raw Material",
      finishedgoods: "Finished Goods",
      serviceproduct: "Service Product",
      nonstockproduct: "Non Stock Product",
      nonstocks: "Non Stock Product",
      intermediaryproduct: "Intermediary Product",
    };

    const normalizedKey = String(value).toLowerCase().replace(/\s/g, "");
    return map[normalizedKey] || value;
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */
  const columns = [
    { key: "productCode", title: "Product Code" },
    { key: "productName", title: "Name" },
    {
      key: "productType",
      title: "Type",
      render: (row: any) => normalizeProductType(row.productType),
    },
    { key: "productHSNCode", title: "HSN Code" },
    { key: "productDescription", title: "Description" },
  ];

  /* =====================================================
     FETCH PRODUCTS
  ===================================================== */
  const fetchProducts = () => {
    dispatch(
      getAllProducts({
        offset: localOffset,
        limit: localLimit,
        search: debouncedSearch,
      }) as any
    );
  };

  useEffect(() => {
    fetchProducts();
  }, [localOffset, localLimit, debouncedSearch]);

  /* =====================================================
     DEBOUNCE SEARCH
  ===================================================== */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setLocalOffset(0);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  /* =====================================================
     REFRESH PRODUCT LIST
  ===================================================== */
  const handleRefresh = async () => {
    // setRefreshing(true);
    await fetchProducts();
    toast.success("Product list refreshed");
    // setRefreshing(false);
  };

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */
  const openAddModal = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */
  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  /* =====================================================
     CREATE / UPDATE PRODUCT
  ===================================================== */
  const handleProductSubmit = async (payload: any) => {
    payload = {
      ...payload,
      csgst: payload.csgst ? Number(payload.csgst) : 0,
      igst: payload.igst ? Number(payload.igst) : 0,
      purchasePrice: payload.purchasePrice ? Number(payload.purchasePrice) : 0,
      sellingPrice: payload.sellingPrice ? Number(payload.sellingPrice) : 0,
    };

    try {
      if (editingProduct) {
        await dispatch(
          updateProduct({
            productCode: editingProduct.productCode,
            data: payload,
          }) as any
        ).unwrap();

        toast.success("Product updated successfully");
      } else {
        await dispatch(createProduct(payload) as any).unwrap();
        toast.success("Product created");
      }

      fetchProducts();
    } catch (err: any) {
      toast.error(
        err?.message || err?.response?.data?.message || "Validation failed"
      );

      throw err;
    }
  };

  /* =====================================================
     DELETE PRODUCT CONFIRM ACTION
  ===================================================== */
  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteProduct(confirmTooltip.productCode) as any).unwrap();
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

  useEffect(() => {
	  const options = HSNCode?.map((e: any) => ({ label: `${e?.code} - ${e?.description}`, value: e?.code, ...e, }));
    const _ = productMasterSchemaFields?.map((c: any) => {
      if (c?.key === "productHSNCode") {
		  return { ...c, options: options, type: "select", };
	  }
      return c;
    });

    setCustomeField(_);
  }, [HSNCode]);

  useEffect(() => {
    // @ts-ignore
    dispatch(getHSNCode({}));
  }, []);

  return (
    <div className="w-full bg-card border border-border text-card-foreground rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
      {/* ================= HEADER ================= */}
      <div
        id="product-header"
        className="flex flex-wrap items-center gap-2 mb-3"
      >
        <div id="product-summary" className="flex items-start gap-3">
          <Badge
            {...{
              count: pagination.totalDocs ?? 0,
              text: "Total Products:",
              varient: "primary",
            }}
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput {...{ search, setSearch }} />
          <DataREfreshButton {...{ callBackFn: handleRefresh }} />

          <Permission
            module="bookez"
            permissionKey="productMaster"
            action="create"
          >
            {/* @ts-ignore */}
            <DataCreateButton
              {...{ callBackFn: openAddModal, text: "Add Product" }}
            />
          </Permission>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        showFloatingFilter={true}
        filterOptions={[
          { value: "all", label: "All" },
          { value: "rawmaterial", label: "Raw Material" },
          { value: "finishedgoods", label: "Finished Goods" },
          { value: "serviceproduct", label: "Service Product" },
          { value: "nonstockproduct", label: "Non Stock Product" },
          { value: "intermediaryproduct", label: "Intermediary Product" },
        ]}
        filterKeys={["productType"]}
        emptyMessage="No products found"
        actions={(prod: any) => (
          <div className="flex items-center gap-2">
            {/* EDIT BUTTON */}
            <Permission
              module="bookez"
              permissionKey="productMaster"
              action="update"
            >
              <button
                id="product-edit-button"
                onClick={() => openEditModal(prod)}
                className="p-2 rounded-lg text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <Edit size={16} />
              </button>
            </Permission>

            <Permission
              module="bookez"
              permissionKey="productMaster"
              action="delete"
            >
              {/* DELETE BUTTON */}
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
                    productCode: prod.productCode,
                  });
                }}
                className="p-2 rounded-lg text-danger hover:bg-danger/10 hover:text-danger transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </Permission>
          </div>
        )}
      />

      {/* ================= PAGINATION ================= */}
      {pagination.totalDocs > 0 && (
        <Pagination
          {...{
            localLimit,
            selectCb: (e: any) => {
              setLocalLimit(Number(e.target.value));
              setLocalOffset(0);
            },
            preDisabled: !pagination.hasPrevPage,
            nextDisabled: !pagination.hasNextPage,
            setLocalOffset,
            pagination,
          }}
        />
      )}

      {/* ================= DELETE TOOLTIP ================= */}
      {confirmTooltip.show && (
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
      )}

      {/* ================= ADD / UPDATE MODAL ================= */}
      <ProductMasterFormModal
        show={showModal}
        setShow={setShowModal}
        editingProduct={editingProduct}
        // @ts-ignore
        productMasterSchemaFields={customeField}
        schemaLoading={schemaLoading}
        units={units}
        onSubmit={handleProductSubmit}
      />
    </div>
  );
};

export default ProductMaster;