import type { ColumnHelper } from "@tanstack/react-table";

/**
 * 从 URL 过滤参数中提取值
 */
export interface FilterValues {
	title?: string;
	userName?: string;
	createdAtFrom?: number;
	createdAtTo?: number;
}

/**
 * 解析 URL 参数中的 filters 字段
 */
export function parseFiltersFromURL(
	searchParams: URLSearchParams,
): FilterValues {
	const filtersParam = searchParams.get("filters");
	const result: FilterValues = {};

	if (!filtersParam) return result;

	try {
		const filters = JSON.parse(filtersParam) as Record<
			string,
			string | string[] | number | number[]
		>;

		// 标题过滤
		if (typeof filters.title === "string") {
			result.title = filters.title;
		}

		// 作者名称过滤 (user.name)
		if (typeof filters["user.name"] === "string") {
			result.userName = filters["user.name"];
		}

		// 创建时间范围过滤
		const createdAt =
			typeof filters.createdAt === "string"
				? [filters.createdAt]
				: Array.isArray(filters.createdAt)
					? filters.createdAt
					: undefined;

		if (createdAt) {
			result.createdAtFrom = createdAt[0] ? Number(createdAt[0]) : undefined;
			result.createdAtTo = createdAt[1] ? Number(createdAt[1]) : undefined;
		}
	} catch {
		// 忽略解析错误
	}

	return result;
}

/**
 * 从 URL 参数构建查询参数
 */
export function buildQueryParamsFromURL(searchParams: URLSearchParams): {
	page: number;
	perPage: number;
} & FilterValues {
	const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
	const perPage =
		Number.parseInt(searchParams.get("perPage") ?? "50", 10) || 50;

	const filterValues = parseFiltersFromURL(searchParams);

	return {
		page,
		perPage,
		...filterValues,
	};
}

/**
 * 列定义助手 - 创建文本列
 */
export interface TextColumnOptions {
	placeholder?: string;
}

export function createTextColumn<TData>(
	columnHelper: ColumnHelper<TData>,
	id: string,
	label: string,
	options?: TextColumnOptions,
) {
	return columnHelper.display({
		id,
		header: label,
		enableColumnFilter: true,
		meta: {
			label,
			variant: "text",
			placeholder: options?.placeholder ?? `搜索${label}...`,
		},
	});
}
