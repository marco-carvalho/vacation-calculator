import { useEffect, useState } from "react";
import type { HolidaysTypes } from "date-holidays";

export type VacationDaysMode = "range" | "list";

export interface FormData {
  workCountry: string;
  workState: string;
  vacationDaysMode: VacationDaysMode;
  minVacationDays: number;
  maxVacationDays: number;
  vacationDaysList: number[];
  startDate: Temporal.PlainDate | null;
  endDate: Temporal.PlainDate | null;
  holidayTypes: Set<HolidaysTypes.HolidayType>;
}

const HOLIDAY_TYPE_VALUES = [
  "public",
  "bank",
  "school",
  "observance",
  "optional",
] as const satisfies readonly HolidaysTypes.HolidayType[];

const HOLIDAY_TYPE_SET = new Set<string>(HOLIDAY_TYPE_VALUES);

export function getDefaultFormData(): FormData {
  const today = Temporal.Now.plainDateISO();
  return {
    workCountry: "BR",
    workState: "",
    vacationDaysMode: "range",
    minVacationDays: 5,
    maxVacationDays: 30,
    vacationDaysList: [5, 10, 15],
    startDate: today,
    endDate: today.add({ years: 1 }),
    holidayTypes: new Set(["public"]),
  };
}

function parseDate(raw: string | null): Temporal.PlainDate | null {
  if (!raw) {
    return null;
  }
  try {
    return Temporal.PlainDate.from(raw);
  } catch {
    return null;
  }
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw == null || raw === "") {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return value;
}

function parseDaysList(raw: string | null, fallback: number[]): number[] {
  if (raw == null || raw === "") {
    return fallback;
  }
  const parsed = raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
  return parsed.length > 0 ? parsed : fallback;
}

function isHolidayType(value: string): value is HolidaysTypes.HolidayType {
  return HOLIDAY_TYPE_SET.has(value);
}

function parseHolidayTypes(
  raw: string | null,
  fallback: Set<HolidaysTypes.HolidayType>,
): Set<HolidaysTypes.HolidayType> {
  if (raw == null) {
    return new Set(fallback);
  }
  if (raw === "") {
    return new Set();
  }
  const types = raw
    .split(",")
    .map((part) => part.trim())
    .filter(isHolidayType);
  return new Set(types);
}

function parseMode(
  raw: string | null,
  fallback: VacationDaysMode,
): VacationDaysMode {
  if (raw === "list" || raw === "range") {
    return raw;
  }
  return fallback;
}

export function parseFormDataFromSearch(search: string): FormData {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const defaults = getDefaultFormData();
  return {
    workCountry: params.get("country") ?? defaults.workCountry,
    workState: params.get("state") ?? defaults.workState,
    vacationDaysMode: parseMode(params.get("mode"), defaults.vacationDaysMode),
    minVacationDays: parsePositiveInt(
      params.get("min"),
      defaults.minVacationDays,
    ),
    maxVacationDays: parsePositiveInt(
      params.get("max"),
      defaults.maxVacationDays,
    ),
    vacationDaysList: parseDaysList(
      params.get("days"),
      defaults.vacationDaysList,
    ),
    startDate: parseDate(params.get("start")) ?? defaults.startDate,
    endDate: parseDate(params.get("end")) ?? defaults.endDate,
    holidayTypes: parseHolidayTypes(
      params.get("holidays"),
      defaults.holidayTypes,
    ),
  };
}

function sameDate(
  a: Temporal.PlainDate | null,
  b: Temporal.PlainDate | null,
): boolean {
  if (a == null || b == null) {
    return a == null && b == null;
  }
  return a.equals(b);
}

function sameNumberList(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameHolidayTypes(
  a: Set<HolidaysTypes.HolidayType>,
  b: Set<HolidaysTypes.HolidayType>,
): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function setIfChanged(
  params: URLSearchParams,
  key: string,
  value: string,
  changed: boolean,
): void {
  if (changed) {
    params.set(key, value);
  }
}

export function serializeFormData(form: FormData): string {
  const defaults = getDefaultFormData();
  const params = new URLSearchParams();

  setIfChanged(
    params,
    "country",
    form.workCountry,
    form.workCountry !== defaults.workCountry,
  );
  setIfChanged(
    params,
    "state",
    form.workState,
    form.workState !== defaults.workState,
  );
  setIfChanged(
    params,
    "mode",
    form.vacationDaysMode,
    form.vacationDaysMode !== defaults.vacationDaysMode,
  );
  setIfChanged(
    params,
    "min",
    String(form.minVacationDays),
    form.minVacationDays !== defaults.minVacationDays,
  );
  setIfChanged(
    params,
    "max",
    String(form.maxVacationDays),
    form.maxVacationDays !== defaults.maxVacationDays,
  );
  setIfChanged(
    params,
    "days",
    form.vacationDaysList.join(","),
    !sameNumberList(form.vacationDaysList, defaults.vacationDaysList),
  );
  setIfChanged(
    params,
    "start",
    form.startDate?.toString() ?? "",
    !sameDate(form.startDate, defaults.startDate) && form.startDate != null,
  );
  setIfChanged(
    params,
    "end",
    form.endDate?.toString() ?? "",
    !sameDate(form.endDate, defaults.endDate) && form.endDate != null,
  );
  setIfChanged(
    params,
    "holidays",
    [...form.holidayTypes].join(","),
    !sameHolidayTypes(form.holidayTypes, defaults.holidayTypes),
  );

  return params.toString();
}

export function replaceUrlSearch(search: string): void {
  const url = new URL(window.location.href);
  url.search = search;
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(null, "", next);
  }
}

export function useFormUrlState() {
  const [formData, setFormData] = useState<FormData>(() =>
    parseFormDataFromSearch(window.location.search),
  );
  const [daysListRaw, setDaysListRaw] = useState(() =>
    formData.vacationDaysList.join(", "),
  );

  useEffect(() => {
    replaceUrlSearch(serializeFormData(formData));
  }, [formData]);

  useEffect(() => {
    const onPopState = () => {
      const next = parseFormDataFromSearch(window.location.search);
      setFormData(next);
      setDaysListRaw(next.vacationDaysList.join(", "));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { formData, setFormData, daysListRaw, setDaysListRaw };
}
