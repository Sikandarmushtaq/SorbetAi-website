import { closedDatesApi } from './closed-dates.api';
import { knowledgeApi } from './knowledge.api';
import { locationsApi } from './locations.api';
import { staffApi } from './staff.api';

const removableResources = {
  closedDates: closedDatesApi,
  staff: staffApi,
  locations: locationsApi,
  knowledge: knowledgeApi,
};

// Deletes an AI Brain record through its matching feature API module.
export function deleteBrainResource(resource, id) {
  const api = removableResources[resource];
  if (!api) {
    throw new Error(`The ${resource} delete action is not supported.`);
  }

  return api.request({ method: 'DELETE', id });
}
