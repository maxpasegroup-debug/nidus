"use client";

import { useEffect, useState } from "react";
import { getCourses } from "@/services/courses";
import type { Course } from "@/types/course";

type CoursesState = {
  courses: Course[];
  error: string | null;
  isLoading: boolean;
};

export function useCourses(): CoursesState {
  const [state, setState] = useState<CoursesState>({
    courses: [],
    error: null,
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    getCourses()
      .then((courses) => {
        if (isMounted) {
          setState({ courses, error: null, isLoading: false });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({
            courses: [],
            error: "Unable to load courses. Confirm the backend is running.",
            isLoading: false
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

