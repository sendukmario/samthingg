"use client";

import { useMutation } from "@tanstack/react-query";
import {
  submitUserEvent,
  TrackEventResponse,
  DynamicTrackEventBody,
} from "@/apis/rest/track-event";
import { AxiosError } from "axios";

type TrackUserEventInput = Omit<DynamicTrackEventBody, "source"> & {
  mint?: string;
};

export function useTrackUserEvent(source: DynamicTrackEventBody["source"]) {
  return useMutation<TrackEventResponse, AxiosError, TrackUserEventInput>({
    mutationFn: ({ mint }) => submitUserEvent({ mint, source }),
  });
}
