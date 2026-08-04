import { useMemo, useState, useEffect, useId } from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import Holidays from "date-holidays";
import type { HolidaysTypes } from "date-holidays";
import { Temporal } from "temporal-polyfill";

const hd = new Holidays();

const DAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  Temporal.PlainDate.from("2024-01-07")
    .add({ days: i })
    .toLocaleString(undefined, { weekday: "short" }),
);

const HOLIDAY_TYPE_OPTIONS: Record<
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

interface Holiday {
  date: Temporal.PlainDate;
  name: string;
}

type VacationDaysMode = "range" | "list";

interface FormData {
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

interface VacationPeriod {
  startDate: Temporal.PlainDate;
  endDate: Temporal.PlainDate;
  usedStartDate: Temporal.PlainDate;
  usedEndDate: Temporal.PlainDate;
  daysCount: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface FormSectionProps {
  children: ReactNode;
}

interface TooltipProps {
  text: string;
}

interface WarningMessageProps {
  message: string;
}

interface NumberInputFieldProps {
  label: string;
  name: keyof FormData;
  value: number;
  icon: string;
  min?: number;
  tooltip?: string | null;
  errorMessage?: string | null;
}

interface SelectFieldProps {
  label: string;
  name: keyof FormData;
  value: string;
  icon: string;
  options: SelectOption[];
  tooltip?: string | null;
}

interface DateFieldProps {
  label: string;
  name: keyof FormData;
  value: Temporal.PlainDate | null;
  tooltip?: string | null;
  errorMessage?: string | null;
}

interface CalendarMonthProps {
  month: Temporal.PlainDate;
  startDate: Temporal.PlainDate;
  endDate: Temporal.PlainDate;
  usedStartDate: Temporal.PlainDate;
  usedEndDate: Temporal.PlainDate;
  dayNames: string[];
}

interface CalendarViewProps {
  startDate: Temporal.PlainDate;
  endDate: Temporal.PlainDate;
  usedStartDate: Temporal.PlainDate;
  usedEndDate: Temporal.PlainDate;
  daysCount: number;
}

interface NumberInputFieldComponentProps extends NumberInputFieldProps {
  onChange: (name: keyof FormData, value: string) => void;
}

interface SelectFieldComponentProps extends SelectFieldProps {
  onChange: (name: keyof FormData, value: string) => void;
}

interface DateFieldComponentProps extends DateFieldProps {
  onChange: (date: Temporal.PlainDate | null) => void;
}

interface CheckboxGroupProps {
  label: string;
  icon: string;
  options: Array<{
    value: HolidaysTypes.HolidayType;
    label: string;
    description: string;
  }>;
  selectedValues: Set<HolidaysTypes.HolidayType>;
  onChange: (value: HolidaysTypes.HolidayType, checked: boolean) => void;
  tooltip: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 ${className}`}
    >
      {children}
    </div>
  );
}

function FormSection({ children }: FormSectionProps) {
  return <div className="grid grid-cols-1 gap-6">{children}</div>;
}

function Tooltip({ text }: TooltipProps) {
  return (
    <span
      className="ml-1 text-indigo-600 dark:text-indigo-400 cursor-help"
      title={text}
    >
      ⓘ
    </span>
  );
}

function WarningMessage({ message }: WarningMessageProps) {
  return (
    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
      <span className="inline-block mr-2">⚠️</span>
      {message}
    </div>
  );
}

function NumberInputField({
  label,
  name,
  value,
  icon,
  min = 0,
  tooltip = null,
  errorMessage = null,
  onChange,
}: NumberInputFieldComponentProps) {
  const hasError = value <= 0;
  const inputId = useId();

  return (
    <div className="space-y-2">
      <Label.Root
        htmlFor={inputId}
        className="block text-gray-700 dark:text-gray-300"
      >
        <span className="inline-block mr-2">{icon}</span> {label}
        {tooltip && <Tooltip text={tooltip} />}
      </Label.Root>
      <input
        id={inputId}
        type="number"
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        min={min}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
      />
      {hasError && errorMessage && <WarningMessage message={errorMessage} />}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  icon,
  options,
  tooltip = null,
  onChange,
}: SelectFieldComponentProps) {
  const selectId = useId();

  return (
    <div className="space-y-2">
      <Label.Root
        htmlFor={selectId}
        className="block text-gray-700 dark:text-gray-300"
      >
        <span className="inline-block mr-2">{icon}</span> {label}
        {tooltip && <Tooltip text={tooltip} />}
      </Label.Root>
      <Select.Root
        value={value === "" ? "__empty_state__" : value}
        onValueChange={(nextValue) =>
          onChange(name, nextValue === "__empty_state__" ? "" : nextValue)
        }
      >
        <Select.Trigger
          id={selectId}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-between"
        >
          <Select.Value />
          <Select.Icon>⌄</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-lg"
          >
            <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center text-gray-500 dark:text-gray-400">
              ▲
            </Select.ScrollUpButton>
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value === "" ? "__empty_state__" : option.value}
                  className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 outline-none data-[highlighted]:bg-indigo-50 dark:data-[highlighted]:bg-indigo-900/50"
                >
                  <Select.ItemIndicator className="absolute left-2">
                    ✓
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center text-gray-500 dark:text-gray-400">
              ▼
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  tooltip = null,
  errorMessage = null,
  onChange,
}: DateFieldComponentProps) {
  const inputId = useId();

  return (
    <div className="space-y-2">
      <Label.Root
        htmlFor={inputId}
        className="block text-gray-700 dark:text-gray-300"
      >
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </Label.Root>
      <input
        id={inputId}
        type="date"
        name={name}
        value={value ? value.toString() : ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw ? Temporal.PlainDate.from(raw) : null);
        }}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
      />
      {errorMessage && <WarningMessage message={errorMessage} />}
    </div>
  );
}

function CheckboxGroup({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  tooltip,
}: CheckboxGroupProps) {
  const groupId = useId();

  return (
    <div className="space-y-2">
      <Label.Root
        id={groupId}
        className="block text-gray-700 dark:text-gray-300"
      >
        <span className="inline-block mr-2">{icon}</span> {label}
        {tooltip && <Tooltip text={tooltip} />}
      </Label.Root>
      <div
        aria-labelledby={groupId}
        className="space-y-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50"
      >
        {options.map((option) => (
          <Label.Root
            key={option.value}
            htmlFor={`${groupId}-${option.value}`}
            className="flex items-start cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 p-2 rounded transition-colors"
          >
            <input
              id={`${groupId}-${option.value}`}
              type="checkbox"
              checked={selectedValues.has(option.value)}
              onChange={(e) => onChange(option.value, e.target.checked)}
              className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-500 rounded cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {option.description}
              </div>
            </div>
          </Label.Root>
        ))}
      </div>
    </div>
  );
}

const THEME_KEY = "vacation-calculator-theme";

function VacationCalculator() {
  const [showCalendars, setShowCalendars] = useState<boolean>(false);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [expandedExtraDays, setExpandedExtraDays] = useState<Set<number>>(
    new Set(),
  );
  const [daysListRaw, setDaysListRaw] = useState<string>("5, 10, 15");
  const [isDark, setIsDark] = useState<boolean>(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(),
  );

  const getCurrentDate = (): Temporal.PlainDate => {
    return Temporal.Now.plainDateISO();
  };

  const getDateOneYearFromNow = (): Temporal.PlainDate => {
    return Temporal.Now.plainDateISO().add({ years: 1 });
  };

  const [formData, setFormData] = useState<FormData>({
    workCountry: "BR",
    workState: "",
    vacationDaysMode: "range",
    minVacationDays: 5,
    maxVacationDays: 30,
    vacationDaysList: [5, 10, 15],
    startDate: getCurrentDate(),
    endDate: getDateOneYearFromNow(),
    holidayTypes: new Set(["public"]),
  });

  const holidays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) {
      return [];
    }

    const holidayCalendar = hd;
    holidayCalendar.init(formData.workCountry, formData.workState);

    const startYear = formData.startDate.year;
    const endYear = formData.endDate.year;

    const holidayList: Holiday[] = [];

    const toPlainDate = (d: Date): Temporal.PlainDate =>
      Temporal.PlainDate.from({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      });

    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = holidayCalendar.getHolidays(year);

      yearHolidays.forEach((h: HolidaysTypes.Holiday) => {
        if (!formData.holidayTypes.has(h.type)) {
          return;
        }

        const start = toPlainDate(h.start);
        const end = toPlainDate(h.end);

        let currentDate = start;
        while (Temporal.PlainDate.compare(currentDate, end) < 0) {
          holidayList.push({
            date: currentDate,
            name: h.name,
          });

          currentDate = currentDate.add({ days: 1 });
        }
      });
    }

    return holidayList;
  }, [
    formData.endDate,
    formData.startDate,
    formData.workCountry,
    formData.workState,
    formData.holidayTypes,
  ]);

  const handleNumberChange = (name: keyof FormData, value: string): void => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    setFormData({
      ...formData,
      [name]: numValue,
    });
  };

  const hasErrors = (): boolean => {
    if (!formData.startDate || !formData.endDate) {
      return true;
    }
    if (Temporal.PlainDate.compare(formData.endDate, formData.startDate) <= 0)
      return true;

    if (formData.vacationDaysMode === "range") {
      if (formData.minVacationDays <= 0 || formData.maxVacationDays <= 0)
        return true;
      if (formData.minVacationDays > formData.maxVacationDays) return true;
    } else {
      if (formData.vacationDaysList.length === 0) return true;
    }

    return false;
  };

  const isHoliday = (date: Temporal.PlainDate): boolean => {
    return holidays.some((holiday) => holiday.date.equals(date));
  };

  const isWeekendOrHoliday = (date: Temporal.PlainDate): boolean => {
    const day = date.dayOfWeek;
    return day === 6 || day === 7 || isHoliday(date);
  };

  const handleCalculate = (): void => {
    const { minVacationDays, maxVacationDays, startDate, endDate } = formData;

    if (!startDate || !endDate) return;

    const currentStartDate = startDate;
    const searchEndDate = endDate;

    const calculateExtraStartDate = (
      vacationStartDate: Temporal.PlainDate,
    ): Temporal.PlainDate => {
      let extraStartDate = vacationStartDate;
      let tempDate = vacationStartDate.subtract({ days: 1 });

      while (
        Temporal.PlainDate.compare(tempDate, currentStartDate) >= 0 &&
        isWeekendOrHoliday(tempDate)
      ) {
        extraStartDate = extraStartDate.subtract({ days: 1 });
        tempDate = tempDate.subtract({ days: 1 });
      }

      return extraStartDate;
    };

    const calculateExtraEndDate = (
      vacationEndDate: Temporal.PlainDate,
    ): Temporal.PlainDate => {
      let extraEndDate = vacationEndDate;
      let tempDate = vacationEndDate.add({ days: 1 });

      while (
        Temporal.PlainDate.compare(tempDate, searchEndDate) <= 0 &&
        isWeekendOrHoliday(tempDate)
      ) {
        extraEndDate = extraEndDate.add({ days: 1 });
        tempDate = tempDate.add({ days: 1 });
      }

      return extraEndDate;
    };

    const checkForOverlaps = (
      startDate: Temporal.PlainDate,
      endDate: Temporal.PlainDate,
      existingPeriods: VacationPeriod[],
      minGapBetweenPeriods: number,
    ): boolean => {
      const bufferStartDate = startDate.subtract({ days: minGapBetweenPeriods });
      const bufferEndDate = endDate.add({ days: minGapBetweenPeriods });

      for (const period of existingPeriods) {
        if (
          Temporal.PlainDate.compare(bufferStartDate, period.endDate) <= 0 &&
          Temporal.PlainDate.compare(bufferEndDate, period.startDate) >= 0
        ) {
          return true;
        }
      }

      return false;
    };

    const calculateTotalDaysOff = (period: VacationPeriod): number => {
      const totalDays =
        period.startDate.until(period.endDate, { largestUnit: "day" }).days + 1;

      return totalDays;
    };

    const findBestAvailablePeriods = (
      startDate: Temporal.PlainDate,
      endDate: Temporal.PlainDate,
      existingPeriods: VacationPeriod[],
      daysCount: number,
      minGapBetweenPeriods: number = 3,
    ): VacationPeriod[] => {
      let currentDate = startDate;
      const candidatePeriods: {
        period: VacationPeriod;
        totalDaysOff: number;
      }[] = [];
      const maxSearchDate = endDate;

      while (Temporal.PlainDate.compare(currentDate, maxSearchDate) <= 0) {
        if (
          currentDate.dayOfWeek !== 6 &&
          currentDate.dayOfWeek !== 7 &&
          !isHoliday(currentDate)
        ) {
          const vacationStartDate = currentDate;
          const vacationEndDate = vacationStartDate.add({
            days: daysCount - 1,
          });

          if (Temporal.PlainDate.compare(vacationEndDate, maxSearchDate) > 0) {
            break;
          }

          const extraStartDate = calculateExtraStartDate(vacationStartDate);
          const extraEndDate = calculateExtraEndDate(vacationEndDate);

          const overlaps = checkForOverlaps(
            extraStartDate,
            extraEndDate,
            existingPeriods,
            minGapBetweenPeriods,
          );

          if (!overlaps) {
            const period: VacationPeriod = {
              startDate: extraStartDate,
              endDate: extraEndDate,
              usedStartDate: vacationStartDate,
              usedEndDate: vacationEndDate,
              daysCount: daysCount,
            };

            const totalDaysOff = calculateTotalDaysOff(period);
            candidatePeriods.push({ period, totalDaysOff });
          }
        }

        currentDate = currentDate.add({ days: 1 });
      }

      if (candidatePeriods.length === 0) {
        throw new Error(
          "Could not find any valid vacation period within the search range",
        );
      }

      candidatePeriods.sort((a, b) => {
        if (b.totalDaysOff !== a.totalDaysOff) {
          return b.totalDaysOff - a.totalDaysOff;
        }

        const diffA = Math.abs(
          startDate.until(a.period.usedStartDate, { largestUnit: "day" }).days,
        );
        const diffB = Math.abs(
          startDate.until(b.period.usedStartDate, { largestUnit: "day" }).days,
        );
        return diffA - diffB;
      });

      return candidatePeriods.map((cp) => cp.period);
    };

    const allCandidatePeriods: VacationPeriod[] = [];

    const dayCounts: number[] =
      formData.vacationDaysMode === "range"
        ? Array.from(
            { length: maxVacationDays - minVacationDays + 1 },
            (_, i) => minVacationDays + i,
          )
        : formData.vacationDaysList;

    for (const vacationDays of dayCounts) {
      try {
        const periods = findBestAvailablePeriods(
          currentStartDate,
          searchEndDate,
          [],
          vacationDays,
          0,
        );
        allCandidatePeriods.push(...periods);
      } catch {
        console.warn(
          `No valid periods found for ${vacationDays} vacation days`,
        );
      }
    }

    const filteredPeriods = allCandidatePeriods.filter((period) => {
      const totalDays = calculateTotalDaysOff(period);
      const extraDays = totalDays - period.daysCount;
      return extraDays > 0;
    });

    filteredPeriods.sort((a, b) => {
      const totalDaysA = calculateTotalDaysOff(a);
      const totalDaysB = calculateTotalDaysOff(b);
      const extraDaysA = totalDaysA - a.daysCount;
      const extraDaysB = totalDaysB - b.daysCount;

      if (extraDaysB !== extraDaysA) {
        return extraDaysB - extraDaysA;
      }

      return Temporal.PlainDate.compare(a.usedStartDate, b.usedStartDate);
    });

    setVacationPeriods(filteredPeriods);
    setShowCalendars(true);
    setExpandedExtraDays(new Set());
    setExpandedPeriods(new Set());
    setIsDrawerOpen(false);
  };

  const handleStartDateChange = (date: Temporal.PlainDate | null): void => {
    setFormData({
      ...formData,
      startDate: date,
    });
  };

  const handleEndDateChange = (date: Temporal.PlainDate | null): void => {
    setFormData({
      ...formData,
      endDate: date,
    });
  };

  const handleHolidayTypeChange = (
    type: HolidaysTypes.HolidayType,
    checked: boolean,
  ): void => {
    const newTypes = new Set(formData.holidayTypes);
    if (checked) {
      newTypes.add(type);
    } else {
      newTypes.delete(type);
    }
    setFormData({
      ...formData,
      holidayTypes: newTypes,
    });
  };

  const getStartDateErrorMessage = (): string | null => {
    if (!formData.startDate) {
      return "Please enter a valid start date";
    }
    return null;
  };

  const getEndDateErrorMessage = (): string | null => {
    if (!formData.endDate) {
      return "Please enter a valid end date";
    }
    if (
      formData.startDate &&
      formData.endDate &&
      Temporal.PlainDate.compare(formData.endDate, formData.startDate) <= 0
    ) {
      return "End date must be after start date";
    }
    return null;
  };

  function CalendarMonth({
    month,
    startDate,
    endDate,
    usedStartDate,
    usedEndDate,
    dayNames,
  }: CalendarMonthProps) {
    const monthName = month.toLocaleString(undefined, { month: "long" });
    const year = month.year;
    const daysInMonth = month.daysInMonth;
    const firstDayOfMonth = month.with({ day: 1 }).dayOfWeek % 7;

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const isWeekend = (date: Temporal.PlainDate): boolean => {
      const day = date.dayOfWeek;
      return day === 6 || day === 7;
    };

    const isHolidayDate = (date: Temporal.PlainDate): boolean => {
      return isHoliday(date);
    };

    const getHolidayName = (date: Temporal.PlainDate): string => {
      const holiday = holidays.find((h) => h.date.equals(date));
      return holiday ? holiday.name : "";
    };

    return (
      <div className="text-center space-y-2">
        <h4 className="text-gray-900 dark:text-gray-100">
          {monthName} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-xs text-gray-500 dark:text-gray-400 py-1"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (!day) {
              return (
                <div key={index} className="text-transparent py-1">
                  .
                </div>
              );
            }

            const currentDate = month.with({ day });

            const isVacationDay =
              Temporal.PlainDate.compare(currentDate, usedStartDate) >= 0 &&
              Temporal.PlainDate.compare(currentDate, usedEndDate) <= 0;

            const isExtraDay =
              ((Temporal.PlainDate.compare(currentDate, startDate) >= 0 &&
                Temporal.PlainDate.compare(currentDate, usedStartDate) < 0) ||
                (Temporal.PlainDate.compare(currentDate, usedEndDate) > 0 &&
                  Temporal.PlainDate.compare(currentDate, endDate) <= 0)) &&
              (isWeekend(currentDate) || isHolidayDate(currentDate));

            const showHolidayIcon = isHolidayDate(currentDate);
            const holidayName = showHolidayIcon
              ? getHolidayName(currentDate)
              : "";

            let className = "text-sm py-1 text-gray-900 dark:text-gray-100 ";
            if (isVacationDay) {
              className += "rounded-full bg-indigo-500 text-white font-medium";
            } else if (isExtraDay) {
              className +=
                "rounded-full bg-indigo-100 dark:bg-indigo-500/40 text-indigo-800 dark:text-indigo-200 font-medium";
            }

            return (
              <div key={index} className={className} title={holidayName}>
                {day} {showHolidayIcon && <span>🏝️</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function CalendarView({
    startDate,
    endDate,
    usedStartDate,
    usedEndDate,
    daysCount,
  }: CalendarViewProps) {
    const months: Temporal.PlainDate[] = [];
    const displayStart = startDate;
    const displayEnd = endDate;
    let currentMonth = displayStart.with({ day: 1 });
    const lastMonth = displayEnd.with({ day: 1 });

    while (Temporal.PlainDate.compare(currentMonth, lastMonth) <= 0) {
      months.push(currentMonth);
      currentMonth = currentMonth.add({ months: 1 });
    }

    const usedDays = daysCount;

    const totalDays =
      startDate.until(endDate, { largestUnit: "day" }).days + 1;

    const extraDays = totalDays - usedDays;

    const formatDate = (date: Temporal.PlainDate): string => {
      const day = date.day.toString().padStart(2, "0");
      const month = date.month.toString().padStart(2, "0");
      const year = date.year;
      return `${day}/${month}/${year}`;
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-center">
            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Start
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                {formatDate(usedStartDate)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                End
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                {formatDate(usedEndDate)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Vacation Days
              </div>
              <div className="text-gray-900 dark:text-gray-100">{usedDays}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Extra Days
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                {extraDays}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Days
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                {totalDays}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {months.map((month, monthIndex) => (
            <CalendarMonth
              key={monthIndex}
              month={month}
              startDate={startDate}
              endDate={endDate}
              usedStartDate={usedStartDate}
              usedEndDate={usedEndDate}
              dayNames={DAY_NAMES}
            />
          ))}
        </div>

        <div className="flex items-center justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              Vacation Days
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-100 dark:bg-indigo-700/30 rounded-full mr-2"></div>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              Extra Days
            </span>
          </div>
        </div>
      </div>
    );
  }

  const countryOptions: SelectOption[] = Object.entries(hd.getCountries())
    .map(([code, name]) => ({
      value: code,
      label: name as string,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const stateOptions: SelectOption[] = formData.workCountry
    ? [
        { value: "", label: "-" },
        ...Object.entries(hd.getStates(formData.workCountry) || {})
          .map(([code, name]) => ({
            value: code,
            label: name as string,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ]
    : [];

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto py-6 space-y-6 container">
        <Dialog.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          {/* Header: title top left, theme + options (hamburger) top right */}
          <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            Vacation Calculator
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
                  title={isDrawerOpen ? "Close options" : "Open options"}
                  aria-label={isDrawerOpen ? "Close options" : "Open options"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </Dialog.Trigger>
          </div>
          </header>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/20 dark:bg-black/40 z-20 data-[state=open]:animate-[dialog-overlay-show_300ms_ease-out] data-[state=closed]:animate-[dialog-overlay-hide_300ms_ease-out]" />
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed top-0 right-0 h-dvh w-full max-w-xs bg-white dark:bg-gray-800 shadow-xl z-30 flex flex-col overflow-hidden focus:outline-none dark:shadow-gray-950/50 data-[state=open]:animate-[dialog-content-show_300ms_ease-out] data-[state=closed]:animate-[dialog-content-hide_300ms_ease-out]"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <Dialog.Title className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Options
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                    title="Close"
                  >
                    ✕
                  </button>
                </Dialog.Close>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
                <FormSection>
                  <SelectField
                    label="Work Country"
                    name="workCountry"
                    value={formData.workCountry}
                    icon="🌎"
                    options={countryOptions}
                    tooltip="Select the country where you work"
                    onChange={(name, value) =>
                      setFormData({ ...formData, [name]: value })
                    }
                  />

                  <SelectField
                    label="Work State"
                    name="workState"
                    value={formData.workState}
                    icon="🏙️"
                    options={stateOptions}
                    tooltip="Select the state where you work"
                    onChange={(name, value) =>
                      setFormData({ ...formData, [name]: value })
                    }
                  />
                </FormSection>

                <FormSection>
                  <CheckboxGroup
                    label="Holiday Types to Consider"
                    icon="🏝️"
                    options={Object.entries(HOLIDAY_TYPE_OPTIONS).map(
                      ([value, { label, description }]) => ({
                        value: value as HolidaysTypes.HolidayType,
                        label,
                        description,
                      }),
                    )}
                    selectedValues={formData.holidayTypes}
                    onChange={handleHolidayTypeChange}
                    tooltip="Select which types of holidays should be considered as days off in the calculation"
                  />
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <label className="block text-gray-700 dark:text-gray-300">
                      <span className="inline-block mr-2">📅</span> Holidays in date range
                    </label>
                    <div className="h-48 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50">
                    {formData.holidayTypes.size === 0 ? (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        Select at least one holiday type above.
                      </div>
                    ) : (() => {
                      const { startDate, endDate } = formData;
                      const inRange =
                        startDate && endDate
                          ? holidays
                              .filter(
                                (h) =>
                                  Temporal.PlainDate.compare(
                                    h.date,
                                    startDate,
                                  ) >= 0 &&
                                  Temporal.PlainDate.compare(
                                    h.date,
                                    endDate,
                                  ) <= 0,
                              )
                              .sort((a, b) =>
                                Temporal.PlainDate.compare(a.date, b.date),
                              )
                          : [];
                      const formatDate = (d: Temporal.PlainDate) =>
                        `${d.day.toString().padStart(2, "0")}/${d.month.toString().padStart(2, "0")}/${d.year}`;
                      return inRange.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                          No holidays in the selected date range.
                        </div>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <tr>
                              <th className="px-3 py-2 font-medium">Date</th>
                              <th className="px-3 py-2 font-medium">Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inRange.map((h, i) => (
                              <tr
                                key={`${h.date.toString()}-${i}`}
                                className="border-t border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                              >
                                <td className="px-3 py-1.5 whitespace-nowrap">
                                  {formatDate(h.date)}
                                </td>
                                <td className="px-3 py-1.5">{h.name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                    </div>
                  </div>
                </FormSection>

                <FormSection>
                  <div className="space-y-2">
                    <label className="block text-gray-700 dark:text-gray-300">
                      <span className="inline-block mr-2">📆</span> Vacation Days
                      <Tooltip text="Range: try every count from min to max. List: try only the specific counts you enter." />
                    </label>
                    <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
                      {(["range", "list"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, vacationDaysMode: mode })
                          }
                          className={`flex-1 py-2 text-sm font-medium transition-colors ${
                            formData.vacationDaysMode === mode
                              ? "bg-indigo-600 text-white dark:bg-indigo-500"
                              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                        >
                          {mode === "range" ? "Range" : "List"}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.vacationDaysMode === "range"
                        ? "Try every day count from min to max."
                        : "Try only the specific day counts you list."}
                    </p>
                  </div>

                  {formData.vacationDaysMode === "range" ? (
                    <>
                      <NumberInputField
                        label="Min Vacation Days"
                        name="minVacationDays"
                        value={formData.minVacationDays}
                        icon="📆"
                        min={1}
                        tooltip="Minimum number of vacation days to consider"
                        errorMessage="Min vacation days must be greater than 0"
                        onChange={handleNumberChange}
                      />
                      <NumberInputField
                        label="Max Vacation Days"
                        name="maxVacationDays"
                        value={formData.maxVacationDays}
                        icon="📆"
                        min={1}
                        tooltip="Maximum number of vacation days to consider"
                        errorMessage="Max vacation days must be greater than 0"
                        onChange={handleNumberChange}
                      />
                      {formData.minVacationDays > formData.maxVacationDays && (
                        <WarningMessage message="Min vacation days cannot be greater than max vacation days" />
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-gray-700 dark:text-gray-300">
                        <span className="inline-block mr-2">📆</span> Day Counts
                        <Tooltip text="Enter the specific vacation day counts separated by commas (e.g. 5, 10, 15)" />
                      </label>
                      <input
                        type="text"
                        value={daysListRaw}
                        onChange={(e) => setDaysListRaw(e.target.value)}
                        onBlur={() => {
                          const parsed = daysListRaw
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s !== "")
                            .map(Number)
                            .filter((n) => !isNaN(n) && n > 0);
                          if (parsed.length > 0) {
                            setFormData({
                              ...formData,
                              vacationDaysList: parsed,
                            });
                            setDaysListRaw(parsed.join(", "));
                          }
                        }}
                        placeholder="e.g. 5, 10, 15, 20"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                      {formData.vacationDaysList.length === 0 && (
                        <WarningMessage message="Enter at least one day count" />
                      )}
                    </div>
                  )}
                </FormSection>

                <FormSection>
                  <DateField
                    label="Start Date"
                    name="startDate"
                    value={formData.startDate}
                    tooltip="First date to consider for vacation planning"
                    onChange={handleStartDateChange}
                    errorMessage={getStartDateErrorMessage()}
                  />
                  <DateField
                    label="End Date"
                    name="endDate"
                    value={formData.endDate}
                    tooltip="Last date to consider for vacation planning"
                    onChange={handleEndDateChange}
                    errorMessage={getEndDateErrorMessage()}
                  />
                </FormSection>
              </div>
              <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={hasErrors()}
                  className={`w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
                    hasErrors()
                      ? "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  }`}
                >
                  Calculate
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Main content: results */}
        <div>
          {showCalendars ? (
            <div>
              <Card className="p-4">
                {(() => {
                  const periodsByExtraDays = new Map<
                    number,
                    VacationPeriod[]
                  >();

                  vacationPeriods.forEach((period) => {
                    const totalDays =
                      period.startDate.until(period.endDate, {
                        largestUnit: "day",
                      }).days + 1;
                    const extraDays = totalDays - period.daysCount;

                    if (!periodsByExtraDays.has(extraDays)) {
                      periodsByExtraDays.set(extraDays, []);
                    }
                    periodsByExtraDays.get(extraDays)!.push(period);
                  });

                  const sortedExtraDays = Array.from(
                    periodsByExtraDays.keys(),
                  ).sort((a, b) => b - a);

                  const formatDate = (date: Temporal.PlainDate): string => {
                    const day = date.day.toString().padStart(2, "0");
                    const month = date.month.toString().padStart(2, "0");
                    const year = date.year;
                    return `${day}/${month}/${year}`;
                  };

                  return (
                    <div className="space-y-2">
                      {sortedExtraDays.map((extraDays) => {
                        const periods = periodsByExtraDays.get(extraDays)!;
                        const isExtraDaysExpanded =
                          expandedExtraDays.has(extraDays);

                        return (
                          <div
                            key={extraDays}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            {/* Level 1: Extra Days Row */}
                            <button
                              className="w-full px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-left flex items-center justify-between transition-colors"
                              onClick={() => {
                                const newExpanded = new Set(expandedExtraDays);
                                if (isExtraDaysExpanded) {
                                  newExpanded.delete(extraDays);
                                } else {
                                  newExpanded.add(extraDays);
                                }
                                setExpandedExtraDays(newExpanded);
                              }}
                            >
                              <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                                {extraDays} Extra Days ({periods.length} option
                                {periods.length !== 1 ? "s" : ""})
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {isExtraDaysExpanded ? "▼" : "▶"}
                              </span>
                            </button>

                            {/* Level 2: Date Ranges (when extra days row is expanded) */}
                            {isExtraDaysExpanded && (
                              <div className="bg-white dark:bg-gray-800">
                                {periods.map((period, index) => {
                                  const periodKey = `${extraDays}-${index}`;
                                  const isPeriodExpanded =
                                    expandedPeriods.has(periodKey);

                                  return (
                                    <div
                                      key={periodKey}
                                      className="border-t border-gray-200 dark:border-gray-700"
                                    >
                                      {/* Date Range Row */}
                                      <button
                                        className="w-full px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left flex items-center justify-between transition-colors"
                                        onClick={() => {
                                          const newExpanded = new Set(
                                            expandedPeriods,
                                          );
                                          if (isPeriodExpanded) {
                                            newExpanded.delete(periodKey);
                                          } else {
                                            newExpanded.add(periodKey);
                                          }
                                          setExpandedPeriods(newExpanded);
                                        }}
                                      >
                                        <div className="flex items-center space-x-4">
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {formatDate(period.usedStartDate)} -{" "}
                                            {formatDate(period.usedEndDate)}
                                          </span>
                                          <span className="text-sm text-gray-500 dark:text-gray-400">
                                            ({period.daysCount} vacation days)
                                          </span>
                                        </div>
                                        <span className="text-gray-400 dark:text-gray-500">
                                          {isPeriodExpanded ? "▼" : "▶"}
                                        </span>
                                      </button>

                                      {/* Level 3: Calendar (when date range is expanded) */}
                                      {isPeriodExpanded && (
                                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                                          <CalendarView
                                            startDate={period.startDate}
                                            endDate={period.endDate}
                                            usedStartDate={period.usedStartDate}
                                            usedEndDate={period.usedEndDate}
                                            daysCount={period.daysCount}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50">
              <div className="text-gray-400 dark:text-gray-500 text-center space-y-4">
                <div className="text-6xl">📅</div>
                <div className="text-lg">Results will appear here</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VacationCalculator;
