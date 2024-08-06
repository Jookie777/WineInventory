import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    MaterialReactTable,
    // createRow,
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

import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { Wine } from "../utils/types";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function WineListPage() {
    // useParams hook can get the id from the url.
    const { id } = useParams<{ id: string }>();

    const [validationErrors, setValidationErrors] = useState<
        Record<string, string | undefined>
    >({});
    const [editedWines, setEditedWines] = useState<Record<string, Wine>>({});

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

                    //store edited wine in state to be saved later
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
                        setEditedWines({
                            ...editedWines,
                            [row.id]: row.original,
                        });
                    },
                }),
            },
            {
                accessorKey: "vintage",
                header: "年份",
                size: 150,
            },
            {
                accessorKey: "price",
                header: "价格",
                size: 150,
            },
            {
                accessorKey: "quantity",
                header: "数量/支",
                size: 150,
            },

            {
                accessorKey: "origin",
                header: "产地",
                size: 150,
            },
        ],
        []
    );

    // Calling hook functions (create, get, update, delete)
    const { mutateAsync: createWine, isPending: isCreatingWine } =
        useCreateWine();

    // Save the results of fetching wines
    const {
        data: fetchedWines = [],
        isError: isLoadingWinesError,
        isFetching: isFetchingWines,
        isLoading: isLoadingWines,
    } = useGetWines(id);

    const handleCreateWine: MRT_TableOptions<Wine>["onCreatingRowSave"] =
        async ({ values, table }) => {
            // No need to validate wines for now.
            // const newValidationErrors = validateUser(values);
            // if (Object.values(newValidationErrors).some((error) => error)) {
            //     setValidationErrors(newValidationErrors);
            //     return;
            // }
            setValidationErrors({});
            await createWine({ ...values, winelist_id: Number(id) }); // Ensure winelist_id is passed as a number
            table.setCreatingRow(null); //exit creating mode
        };

    const openDeleteConfirmModal = (row: MRT_Row<Wine>) => {
        if (window.confirm("Are you sure you want to delete this wine?")) {
            // deleteUser(row.original.id);
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
        // Copilot fixed row.id => row.id.toString()
        getRowId: (row) => row.id.toString(),
        // muiToolbarAlertBannerProps: isLoadingWinesError
        // ? {
        //     color: 'error',
        //     children: 'Error loading data',
        //   }
        // : undefined,
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
                    // onClick={handleSaveUsers}
                    // disabled={
                    //   Object.keys(editedUsers).length === 0 ||
                    //   Object.values(validationErrors).some((error) => !!error)
                    // }
                >
                    {/* {isUpdatingUsers ? <CircularProgress size={25} /> : 'Save'} */}
                </Button>
                {Object.values(validationErrors).some((error) => !!error) && (
                    <Typography color="error">
                        Fix errors before submitting
                    </Typography>
                )}
            </Box>
        ),
        renderTopToolbarCustomActions: ({ table }) => (
            <Button
                variant="contained"
                sx={{ bgcolor: "#9E7D60" }}
                onClick={() => {
                    table.setCreatingRow(true); //simplest way to open the create row modal with no default values
                    //or you can pass in a row object to set default values with the `createRow` helper function
                    // table.setCreatingRow(
                    //   createRow(table, {
                    //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
                    //   }),
                    // );
                }}
            >
                添加新酒
            </Button>
        ),
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

export default WineListPage;

const validateRequired = (value: string) => !!value.length;
