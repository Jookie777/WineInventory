import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    MaterialReactTable,
    type MRT_ColumnDef,
    type MRT_Row,
    type MRT_TableOptions,
    useMaterialReactTable,
} from "material-react-table";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { MRT_Localization_ZH_HANS } from "material-react-table/locales/zh-Hans";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Wine } from "../utils/types";
import DeleteIcon from "@mui/icons-material/Delete";

function WineListPage() {
    // useParams hook can get the id from the url.
    const { id } = useParams<{ id: string }>();

    const [validationErrors, setValidationErrors] = useState<
        Record<string, string | undefined>
    >({});

    const [editedWines, setEditedWines] = useState<Record<string, Wine>>({});

    // Debugging:
    // useEffect(() => {
    //     console.log("Updated editedUsers:", editedWines);
    // }, [editedWines]);

    const columns = useMemo<MRT_ColumnDef<Wine>[]>(
        () => [
            {
                accessorKey: "name", // can access nested data with dot notation
                header: "名字",
                size: 150,
                muiEditTextFieldProps: ({ cell, row }) => ({
                    type: "text",
                    required: true,
                    error: !!validationErrors[cell.id],
                    helperText: validationErrors[cell.id],

                    onBlur: (event) => {
                        const validationError = !validateRequired(
                            event.currentTarget.value
                        )
                            ? "名字不能为空"
                            : undefined;
                        setValidationErrors({
                            ...validationErrors,
                            [cell.id]: validationError,
                        });
                        setEditedWines((prevEditedWines) => ({
                            ...prevEditedWines,
                            [row.id]: {
                                ...prevEditedWines[row.id],
                                id: Number(row.id), // specify the wine's id for the update logic later
                                name: event.target.value,
                            },
                        }));
                    },
                }),
            },
            {
                accessorKey: "vintage",
                header: "年份",
                size: 150,
                muiEditTextFieldProps: ({ cell, row }) => ({
                    type: "number",
                    required: true,
                    error: !!validationErrors[cell.id],
                    helperText: validationErrors[cell.id],

                    onBlur: (event) => {
                        const validationError = !validateRequired(
                            event.currentTarget.value
                        )
                            ? "年份不能为空"
                            : undefined;
                        setValidationErrors({
                            ...validationErrors,
                            [cell.id]: validationError,
                        });
                        setEditedWines((prevEditedWines) => ({
                            ...prevEditedWines,
                            [row.id]: {
                                ...prevEditedWines[row.id],
                                id: Number(row.id),
                                vintage: Number(event.target.value),
                            },
                        }));
                    },
                }),
            },
            {
                accessorKey: "price",
                header: "价格",
                size: 150,
                muiEditTextFieldProps: ({ cell, row }) => ({
                    type: "number",
                    required: true,
                    error: !!validationErrors[cell.id],
                    helperText: validationErrors[cell.id],

                    onBlur: (event) => {
                        const validationError = !validateRequired(
                            event.currentTarget.value
                        )
                            ? "价格不能为空"
                            : undefined;
                        setValidationErrors({
                            ...validationErrors,
                            [cell.id]: validationError,
                        });
                        setEditedWines((prevEditedWines) => ({
                            ...prevEditedWines,
                            [row.id]: {
                                ...prevEditedWines[row.id],
                                id: Number(row.id),
                                price: Number(event.target.value),
                            },
                        }));
                    },
                }),
            },
            {
                accessorKey: "quantity",
                header: "数量/支",
                size: 150,
                muiEditTextFieldProps: ({ cell, row }) => ({
                    type: "number",
                    required: true,
                    error: !!validationErrors[cell.id],
                    helperText: validationErrors[cell.id],

                    onBlur: (event) => {
                        const validationError = !validateRequired(
                            event.currentTarget.value
                        )
                            ? "数量不能为空"
                            : undefined;
                        setValidationErrors({
                            ...validationErrors,
                            [cell.id]: validationError,
                        });
                        setEditedWines((prevEditedWines) => ({
                            ...prevEditedWines,
                            [row.id]: {
                                ...prevEditedWines[row.id],
                                id: Number(row.id),
                                quantity: Number(event.target.value),
                            },
                        }));
                    },
                }),
            },

            {
                accessorKey: "origin",
                header: "产地",
                size: 150,
                muiEditTextFieldProps: ({ cell, row }) => ({
                    type: "text",
                    required: true,
                    error: !!validationErrors[cell.id],
                    helperText: validationErrors[cell.id],

                    onBlur: (event) => {
                        const validationError = !validateRequired(
                            event.currentTarget.value
                        )
                            ? "产地不能为空"
                            : undefined;
                        setValidationErrors({
                            ...validationErrors,
                            [cell.id]: validationError,
                        });
                        setEditedWines((prevEditedWines) => ({
                            ...prevEditedWines,
                            [row.id]: {
                                ...prevEditedWines[row.id],
                                id: Number(row.id),
                                origin: event.target.value,
                            },
                        }));
                    },
                }),
            },
        ],
        [editedWines, validationErrors]
    );

    // Calling hook functions (CREATE, GET, UPDATE, DELETE)
    const { mutateAsync: createWine, isPending: isCreatingWine } =
        useCreateWine();

    const {
        data: fetchedWines = [],
        isError: isLoadingWinesError,
        isFetching: isFetchingWines,
        isLoading: isLoadingWines,
    } = useGetWines(id);

    const { mutateAsync: updateWines, isPending: isUpdatingWines } =
        useUpdateWines();

    const { mutateAsync: deleteWine, isPending: isDeletingWine } =
        useDeleteWine();

    // 添加新酒 onclick handler
    const handleCreateWine: MRT_TableOptions<Wine>["onCreatingRowSave"] =
        async ({ values, table }) => {
            const newValidationErrors = validateWine(values);
            if (Object.values(newValidationErrors).some((error) => error)) {
                setValidationErrors(newValidationErrors);
                return;
            }
            setValidationErrors({});

            await createWine({ ...values, winelist_id: Number(id) });
            table.setCreatingRow(null); // exit creating mode
        };

    // 保存 onclick handler
    const handleSaveWines = async () => {
        if (Object.values(validationErrors).some((error) => !!error)) return;

        await updateWines(Object.values(editedWines));
        setEditedWines({});
    };

    // DELETE confirmation pop-up window
    const openDeleteConfirmModal = (row: MRT_Row<Wine>) => {
        if (window.confirm("Are you sure you want to delete this wine?")) {
            deleteWine(row.original.id);
        }
    };

    const table = useMaterialReactTable({
        columns,
        data: fetchedWines,
        localization: MRT_Localization_ZH_HANS,
        createDisplayMode: "row",
        editDisplayMode: "table",
        enableEditing: true,
        enableRowActions: true,
        positionActionsColumn: "last",

        // MRT template only has "getRowId: (row) => row.id".
        // But here it expects a string, and it also caused null pointer exception so I added the null check
        getRowId: (row) => (row.id ? row.id.toString() : "undefined-row"),

        muiToolbarAlertBannerProps: isLoadingWinesError
            ? {
                  color: "error",
                  children: "Error loading data",
              }
            : undefined,
        muiTableContainerProps: {
            sx: {
                minHeight: "500px",
            },
        },
        onCreatingRowCancel: () => setValidationErrors({}),
        onCreatingRowSave: handleCreateWine,
        renderRowActions: ({ row }) => (
            <Box sx={{ display: "flex", gap: "1rem" }}>
                <Tooltip title="Delete">
                    <IconButton
                        color="error"
                        onClick={() => openDeleteConfirmModal(row)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        renderBottomToolbarCustomActions: () => (
            <Box sx={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <Button
                    color="success"
                    variant="contained"
                    onClick={handleSaveWines}
                    disabled={
                        Object.keys(editedWines).length === 0 ||
                        Object.values(validationErrors).some((error) => !!error)
                    }
                >
                    {isUpdatingWines ? <CircularProgress size={25} /> : "保存"}
                </Button>
                {Object.values(validationErrors).some((error) => !!error) && (
                    <Typography color="error">
                        请填写所有必填字段后保存
                    </Typography>
                )}
            </Box>
        ),
        renderTopToolbarCustomActions: ({ table }) => (
            <Button
                variant="contained"
                sx={{ bgcolor: "#9E7D60" }}
                onClick={() => {
                    table.setCreatingRow(true);
                }}
            >
                添加新酒
            </Button>
        ),
        state: {
            isLoading: isLoadingWines,
            isSaving: isCreatingWine || isUpdatingWines || isDeletingWine,
            showAlertBanner: isLoadingWinesError,
            showProgressBars: isFetchingWines,
        },
    });

    return <MaterialReactTable table={table} />;
}

// This replaces the traditional useState/useEffect fetch pattern
function useGetWines(id: string | undefined) {
    return useQuery<Wine[]>({
        queryKey: ["wines"],
        queryFn: async () => {
            const response = await fetch(
                `http://127.0.0.1:5000/wine_list/${id}`
            );
            const data = await response.json();
            return data.wines;
        },
        // !! turns null/undefined into False, and valid value into True
        enabled: !!id, // Only fetch if id is valid
        refetchOnWindowFocus: false,
    });
}

function useCreateWine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (wine: Wine) => {
            const response = await fetch(
                `http://127.0.0.1:5000/create_wine/${wine.winelist_id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(wine),
                }
            );
            if (!response.ok) {
                throw new Error("Error creating wine");
            }
            return response.json();
        },
        onMutate: (newWine: Wine) => {
            queryClient.setQueryData(
                ["wines"],
                (prevWines: Wine[] = []) =>
                    [
                        ...prevWines,
                        {
                            ...newWine,
                            id: (Math.random() + 1).toString(36).substring(7), // Generate a temporary ID
                        },
                    ] as Wine[]
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["wines"] }); // Refetch wines after mutation
        },
    });
}

//UPDATE hook (put user in api)
function useUpdateWines() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (wines: Wine[]) => {
            const response = await fetch(`http://127.0.0.1:5000/update_wines`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(wines),
            });
            if (!response.ok) {
                throw new Error("Error updating wine");
            }
            return response.json();
        },
        onMutate: async (newWines: Wine[]) => {
            await queryClient.cancelQueries({ queryKey: ["wines"] }); // Cancel any outgoing queries so they don't overwrite our optimistic update

            const previousWines = queryClient.getQueryData<Wine[]>(["wines"]);

            queryClient.setQueryData(["wines"], (prevWines: Wine[] = []) => {
                const updatedWines = prevWines.map((wine) => {
                    const newWine = newWines.find((nw) => nw.id === wine.id);
                    return newWine ? { ...wine, ...newWine } : wine;
                });
                return updatedWines;
            });

            return { previousWines };
        },
        // prefixing with _ to indicate that we are not using these variables
        onError: (_err, _newWines, context) => {
            queryClient.setQueryData(["wines"], context?.previousWines); // Roll back to the previous state if mutation fails
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["wines"] }); // Refetch wines after mutation
        },
    });
}

function useDeleteWine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (wineId: number) => {
            const response = await fetch(
                `http://127.0.0.1:5000/delete_wine/${wineId}`,
                {
                    method: "DELETE",
                }
            );
            if (!response.ok) {
                throw new Error("Error creating wine");
            }
            return response.json();
        },
        onMutate: (wineId: number) => {
            queryClient.setQueryData(["wines"], (prevUsers: any) =>
                prevUsers?.filter((wine: Wine) => wine.id !== wineId)
            );
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["wines"] }),
    });
}

const validateRequired = (value: string) => !!value.length;

function validateWine(wine: Wine) {
    return {
        name: !validateRequired(wine.name) ? "名字不能为空" : "",
        vintage: !validateRequired(wine.vintage.toString())
            ? "年份不能为空"
            : "",
        price: !validateRequired(wine.price.toString()) ? "价格不能为空" : "",
        quantity: !validateRequired(wine.quantity.toString())
            ? "数量不能为空"
            : "",
        origin: !validateRequired(wine.origin) ? "产地不能为空" : "",
    };
}

export default WineListPage;
