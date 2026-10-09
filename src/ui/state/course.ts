import { useSyncExternalStore } from 'react';
import { createCourseStore, type CourseState } from '../model/course-store';

/** The one in-memory course shared by the four screens. */
export const courseStore = createCourseStore();

export function useCourse(): CourseState {
  return useSyncExternalStore(courseStore.subscribe, courseStore.get, courseStore.get);
}
