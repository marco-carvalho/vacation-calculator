import { useEffect, useState } from "react";
import type { HolidaysTypes } from "date-holidays";
import { z } from "zod";

export const HOLIDAY_TYPE_OPTIONS: Record<
  HolidaysTypes.HolidayType,
  { label: string; description: string }
> = {
  public: {
    label: "Public Holidays",
    description:
      "National holidays with paid time off (e.g., New Year, Christmas)",
  },
  bank: {
    label: "Bank Holidays",
    description: "Banking sector holidays",
  },
  school: {
    label: "School Holidays",
    description: "School breaks and recesses",
  },
  observance: {
    label: "Observances",
    description:
      "Commemorative dates without paid time off (e.g., Valentine's Day)",
  },
  optional: {
    label: "Optional Holidays",
    description: "Optional holidays that may vary by employer",
  },
};

export const holidayTypeSchema = z.custom<HolidaysTypes.HolidayType>();
export const vacationDaysModeSchema = z.enum(["range", "list"]);
export const plainDateSchema = z.instanceof(Temporal.PlainDate);

export const formDataSchema = z.object({
  workCountry: z.string(),
  workState: z.string(),
  vacationDaysMode: vacationDaysModeSchema,
  minVacationDays: z.number().int().positive(),
  maxVacationDays: z.number().int().positive(),
  vacationDaysList: z.array(z.number().int().positive()),
  windowStart: plainDateSchema.nullable(),
  windowEnd: plainDateSchema.nullable(),
  holidayTypes: z.set(holidayTypeSchema),
});

export type VacationDaysMode = z.infer<typeof vacationDaysModeSchema>;
export type FormData = z.infer<typeof formDataSchema>;

const positiveIntFromSearch = z
  .string()
  .transform((raw) => Number.parseInt(raw, 10))
  .pipe(z.number().int().positive());

const daysListFromSearch = z.string().transform((raw, ctx) => {
  const parsed = raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (parsed.length === 0) {
    ctx.addIssue({ code: "custom", message: "empty" });
    return z.NEVER;
  }
  return parsed;
});

const plainDateFromSearch = z.string().transform((raw, ctx) => {
  try {
    return Temporal.PlainDate.from(raw);
  } catch {
    ctx.addIssue({ code: "custom", message: "invalid date" });
    return z.NEVER;
  }
});

const holidayTypesFromSearch = z.string().transform((raw) => {
  if (raw === "") {
    return new Set<HolidaysTypes.HolidayType>();
  }
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(
        (part): part is HolidaysTypes.HolidayType =>
          part in HOLIDAY_TYPE_OPTIONS,
      ),
  );
});

export function getDefaultFormData(): FormData {
  const today = Temporal.Now.plainDateISO();
  return formDataSchema.parse({
    workCountry: "BR",
    workState: "",
    vacationDaysMode: "range",
    minVacationDays: 5,
    maxVacationDays: 30,
    vacationDaysList: [5, 10, 15],
    windowStart: today,
    windowEnd: today.add({ years: 1 }),
    holidayTypes: new Set(["public"]),
  });
}

function searchFormSchema(defaults: FormData) {
  return z.object({
    workCountry: z.string().catch(defaults.workCountry),
    workState: z.string().catch(defaults.workState),
    vacationDaysMode: vacationDaysModeSchema.catch(defaults.vacationDaysMode),
    minVacationDays: positiveIntFromSearch.catch(defaults.minVacationDays),
    maxVacationDays: positiveIntFromSearch.catch(defaults.maxVacationDays),
    vacationDaysList: daysListFromSearch.catch(defaults.vacationDaysList),
    windowStart: plainDateFromSearch.catch(
      () => defaults.windowStart ?? Temporal.Now.plainDateISO(),
    ),
    windowEnd: plainDateFromSearch.catch(
      () => defaults.windowEnd ?? Temporal.Now.plainDateISO(),
    ),
    holidayTypes: holidayTypesFromSearch.catch(
      () => new Set(defaults.holidayTypes),
    ),
  });
}

export function parseFormDataFromSearch(search: string): FormData {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const defaults = getDefaultFormData();
  return searchFormSchema(defaults).parse({
    workCountry: params.get("workCountry"),
    workState: params.get("workState"),
    vacationDaysMode: params.get("vacationDaysMode"),
    minVacationDays: params.get("minVacationDays"),
    maxVacationDays: params.get("maxVacationDays"),
    vacationDaysList: params.get("vacationDaysList"),
    windowStart: params.get("windowStart"),
    windowEnd: params.get("windowEnd"),
    holidayTypes: params.get("holidayTypes"),
  });
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
    "workCountry",
    form.workCountry,
    form.workCountry !== defaults.workCountry,
  );
  setIfChanged(
    params,
    "workState",
    form.workState,
    form.workState !== defaults.workState,
  );
  setIfChanged(
    params,
    "vacationDaysMode",
    form.vacationDaysMode,
    form.vacationDaysMode !== defaults.vacationDaysMode,
  );
  setIfChanged(
    params,
    "minVacationDays",
    String(form.minVacationDays),
    form.minVacationDays !== defaults.minVacationDays,
  );
  setIfChanged(
    params,
    "maxVacationDays",
    String(form.maxVacationDays),
    form.maxVacationDays !== defaults.maxVacationDays,
  );
  setIfChanged(
    params,
    "vacationDaysList",
    form.vacationDaysList.join(","),
    !sameNumberList(form.vacationDaysList, defaults.vacationDaysList),
  );
  setIfChanged(
    params,
    "windowStart",
    form.windowStart?.toString() ?? "",
    !sameDate(form.windowStart, defaults.windowStart) &&
      form.windowStart != null,
  );
  setIfChanged(
    params,
    "windowEnd",
    form.windowEnd?.toString() ?? "",
    !sameDate(form.windowEnd, defaults.windowEnd) && form.windowEnd != null,
  );
  setIfChanged(
    params,
    "holidayTypes",
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
