/* ===================================================
   BASE SKELETON
=================================================== */

type SkeletonProps = {
    className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200 ${className}`}
        />
    );
};

export const SkeletonText = ({ className = "" }: SkeletonProps) => {
    return <Skeleton className={`h-4 ${className}`} />;
};

export const SkeletonCircle = ({ className = "" }: SkeletonProps) => {
    return (
        <div
            className={`animate-pulse rounded-full bg-slate-200 ${className}`}
        />
    );
};

/* ===================================================
   PAGE HEADER SKELETON
=================================================== */

export const PageHeaderSkeleton = () => {
    return (
        <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-8 w-32 rounded-full" />

            <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-56 rounded-md" />
                <Skeleton className="h-9 w-10 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
            </div>
        </div>
    );
};

/* ===================================================
   TABLE SKELETON
=================================================== */

type TableSkeletonProps = {
    rows?: number;
    columns?: number;
};

export const TableSkeleton = ({
    rows = 8,
    columns = 6,
}: TableSkeletonProps) => {
    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50">
                <div
                    className="grid gap-4 px-4 py-3"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                >
                    {Array.from({ length: columns }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="h-4 w-24"
                        />
                    ))}
                </div>
            </div>

            <div>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="border-b border-slate-100 last:border-b-0"
                    >
                        <div
                            className="grid gap-4 px-4 py-4"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Skeleton
                                    key={colIndex}
                                    className="h-4 w-full"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ===================================================
   MODAL LIST SKELETON
=================================================== */

type ModalListSkeletonProps = {
    rows?: number;
};

export const ModalListSkeleton = ({
    rows = 6,
}: ModalListSkeletonProps) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="w-full">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="mt-2 h-3 w-24" />
                        </div>

                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ===================================================
   FORM SKELETON
=================================================== */

type FormSkeletonProps = {
    headerFields?: number;
    bodyRows?: number;
    bodyColumns?: number;
    footerFields?: number;
};

export const FormSkeleton = ({
    headerFields = 6,
    bodyRows = 3,
    bodyColumns = 6,
    footerFields = 4,
}: FormSkeletonProps) => {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="mb-4 h-6 w-40" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Array.from({ length: headerFields }).map((_, index) => (
                        <div key={index}>
                            <Skeleton className="mb-2 h-4 w-28" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <Skeleton className="mb-4 h-6 w-36" />

                <div className="overflow-hidden rounded-xl border border-slate-200">
                    {Array.from({ length: bodyRows }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0"
                            style={{
                                gridTemplateColumns: `repeat(${bodyColumns}, minmax(0, 1fr))`,
                            }}
                        >
                            {Array.from({ length: bodyColumns }).map((_, colIndex) => (
                                <Skeleton
                                    key={colIndex}
                                    className="h-10 w-full rounded-lg"
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <Skeleton className="mb-4 h-6 w-32" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {Array.from({ length: footerFields }).map((_, index) => (
                        <div key={index}>
                            <Skeleton className="mb-2 h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ===================================================
   FULL MODULE PAGE SKELETON
=================================================== */

type ModulePageSkeletonProps = {
    rows?: number;
    columns?: number;
};

export const ModulePageSkeleton = ({
    rows = 8,
    columns = 6,
}: ModulePageSkeletonProps) => {
    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <PageHeaderSkeleton />
            <TableSkeleton rows={rows} columns={columns} />
        </div>
    );
};

export default ModulePageSkeleton;



export const DynamicFormContentSkeleton = ({
    headerFields = 5,
    bodyRows = 2,
    bodyColumns = 7,
    footerFields = 6,
}: {
    headerFields?: number;
    bodyRows?: number;
    bodyColumns?: number;
    footerFields?: number;
}) => {
    return (
        <div className="space-y-8">
            {/* Header Fields Skeleton */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {Array.from({ length: headerFields }).map((_, index) => (
                    <div key={`header-${index}`}>
                        <Skeleton className="mb-2 h-4 w-32" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Product Section Skeleton */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>

                <div className="overflow-hidden rounded-md border border-slate-200">
                    <div
                        className="grid border-b border-slate-300 bg-slate-100"
                        style={{
                            gridTemplateColumns: `60px repeat(${bodyColumns}, minmax(160px, 1fr))`,
                        }}
                    >
                        {Array.from({ length: bodyColumns + 1 }).map((_, index) => (
                            <div
                                key={`body-head-${index}`}
                                className="border-r border-slate-300 px-3 py-3 last:border-r-0"
                            >
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ))}
                    </div>

                    {Array.from({ length: bodyRows }).map((_, rowIndex) => (
                        <div
                            key={`body-row-${rowIndex}`}
                            className="grid border-b border-slate-200 last:border-b-0"
                            style={{
                                gridTemplateColumns: `60px repeat(${bodyColumns}, minmax(160px, 1fr))`,
                            }}
                        >
                            {Array.from({ length: bodyColumns + 1 }).map((_, colIndex) => (
                                <div
                                    key={`body-cell-${rowIndex}-${colIndex}`}
                                    className="border-r border-slate-200 px-3 py-3 last:border-r-0"
                                >
                                    <Skeleton className="h-9 w-full rounded-md" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Skeleton */}
            <div className="rounded-lg border border-slate-200 p-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {Array.from({ length: footerFields }).map((_, index) => (
                        <div
                            key={`footer-${index}`}
                            className="flex items-center justify-between rounded-lg bg-slate-50 p-5"
                        >
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};