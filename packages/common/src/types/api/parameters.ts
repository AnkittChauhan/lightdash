import type { KnexPaginatedData } from '../knex-paginate';
import type { LightdashProjectParameter } from '../lightdashProjectConfig';

export type ApiGetProjectParametersResults = Record<
    string,
    LightdashProjectParameter
>;

export type ProjectParameterSummary = {
    name: string;
    label: string;
    description?: string;
    default?: string | string[];
    createdAt: Date;
};

export type ApiGetProjectParametersListResults = KnexPaginatedData<
    ProjectParameterSummary[]
>;
