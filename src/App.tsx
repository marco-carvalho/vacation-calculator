import React, { useMemo, useState } from "react";
import Holidays, { HolidaysTypes } from "date-holidays";

const hd = new Holidays();

interface Holiday {
  date: Date;
  name: string;
}

interface FormData {
  workCountry: string;
  workState: string;
  minVacationDays: number;
  maxVacationDays: number;
  startDate: Date;
  endDate: Date;
}

interface VacationPeriod {
  startDate: Date;
  endDate: Date;
  usedStartDate: Date;
  usedEndDate: Date;
  daysCount: number;
}

interface SelectOption {
  value: string | undefined;
  label: string;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface FormSectionProps {
  children: React.ReactNode;
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
  tooltip: string;
  errorMessage?: string | null;
}

interface SelectFieldProps {
  label: string;
  name: keyof FormData;
  value: string;
  icon: string;
  options: SelectOption[];
  tooltip: string;
}

interface DateFieldProps {
  label: string;
  name: keyof FormData;
  value: Date;
  tooltip: string;
  errorMessage?: string | null;
}

interface CalendarMonthProps {
  month: Date;
  startDate: Date;
  endDate: Date;
  usedStartDate: Date;
  usedEndDate: Date;
  dayNames: string[];
}

interface CalendarViewProps {
  startDate: Date;
  endDate: Date;
  usedStartDate: Date;
  usedEndDate: Date;
  daysCount: number;
}

interface NumberInputFieldComponentProps extends NumberInputFieldProps {
  onChange: (name: keyof FormData, value: string) => void;
}

interface SelectFieldComponentProps extends SelectFieldProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

interface DateFieldComponentProps extends DateFieldProps {
  onChange: (date: Date) => void;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>
    {children}
  </div>
);

const FormSection: React.FC<FormSectionProps> = ({ children }) => (
  <div className="grid grid-cols-1 gap-6 mb-6">
    {children}
  </div>
);

const Tooltip: React.FC<TooltipProps> = ({ text }) => (
  <span className="ml-1 text-indigo-600 cursor-help" title={text}>
    ⓘ
  </span>
);

const WarningMessage: React.FC<WarningMessageProps> = ({ message }) => {
  return (
    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
      <span className="inline-block mr-2">⚠️</span>
      {message}
    </div>
  );
};

const NumberInputField: React.FC<NumberInputFieldComponentProps> = ({
  label,
  name,
  value,
  icon,
  min = 0,
  tooltip = null,
  errorMessage = null,
  onChange,
}) => {
  const hasError = value <= 0;

  return (
    <div className="space-y-2">
      <label className="block text-gray-700">
        <span className="inline-block mr-2">{icon}</span> {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        min={min}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      {hasError && errorMessage && <WarningMessage message={errorMessage} />}
    </div>
  );
};

const SelectField: React.FC<SelectFieldComponentProps> = ({
  label,
  name,
  value,
  icon,
  options,
  tooltip = null,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-gray-700">
        <span className="inline-block mr-2">{icon}</span> {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const DateField: React.FC<DateFieldComponentProps> = ({
  label,
  name,
  value,
  tooltip = null,
  errorMessage = null,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-gray-700">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <input
        type="date"
        name={name}
        value={value instanceof Date && !isNaN(value.getTime()) ? value.toISOString().split("T")[0] : ''}
        onChange={(e) => {
          const newDate = new Date(e.target.value);
          onChange(newDate);
        }}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      {errorMessage && <WarningMessage message={errorMessage} />}
    </div>
  );
};

const VacationCalculator: React.FC = () => {
  const [showCalendars, setShowCalendars] = useState<boolean>(false);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [expandedExtraDays, setExpandedExtraDays] = useState<Set<number>>(new Set());
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  const getCurrentDate = (): Date => {
    return new Date();
  };

  const getDateOneYearFromNow = (): Date => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    return nextYear;
  };

  const [formData, setFormData] = useState<FormData>({
    workCountry: "BR",
    workState: "",
    minVacationDays: 5,
    maxVacationDays: 30,
    startDate: getCurrentDate(),
    endDate: getDateOneYearFromNow(),
  });

  const holidays = useMemo(() => {
    if (!formData.startDate || !formData.endDate ||
        isNaN(formData.startDate.getTime()) || isNaN(formData.endDate.getTime())) {
      return [];
    }

    const holidayCalendar = hd;
    holidayCalendar.init(formData.workCountry, formData.workState);

    const startYear = formData.startDate.getFullYear();
    const endYear = formData.endDate.getFullYear();

    const holidayList: Holiday[] = [];

    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = holidayCalendar.getHolidays(year);

      yearHolidays.forEach((h: HolidaysTypes.Holiday) => {
        const start = new Date(h.start);
        const end = new Date(h.end);

        const currentDate = new Date(start);
        while (currentDate < end) {
          holidayList.push({
            date: new Date(currentDate),
            name: h.name,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    return holidayList;
  }, [
    formData.endDate,
    formData.startDate,
    formData.workCountry,
    formData.workState,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNumberChange = (name: keyof FormData, value: string): void => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    setFormData({
      ...formData,
      [name]: numValue,
    });
  };

  const hasErrors = (): boolean => {
    if (!formData.startDate || !formData.endDate ||
        isNaN(formData.startDate.getTime()) || isNaN(formData.endDate.getTime())) {
      return true;
    }
    if (formData.endDate <= formData.startDate) return true;
    if (formData.minVacationDays <= 0 || formData.maxVacationDays <= 0) return true;
    if (formData.minVacationDays > formData.maxVacationDays) return true;
    return false;
  };

  const isHoliday = (date: Date): boolean => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    return holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date);
      holidayDate.setHours(0, 0, 0, 0);
      return holidayDate.getTime() === normalizedDate.getTime();
    });
  };

  const isWeekendOrHoliday = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6 || isHoliday(date);
  };

  const handleCalculate = (): void => {
    const {
      minVacationDays,
      maxVacationDays,
      startDate,
      endDate,
    } = formData;

    const currentStartDate = new Date(startDate);
    const searchEndDate = new Date(endDate);

    const calculateExtraStartDate = (vacationStartDate: Date): Date => {
      const extraStartDate = new Date(vacationStartDate);
      const tempDate = new Date(vacationStartDate);
      tempDate.setDate(tempDate.getDate() - 1);

      while (isWeekendOrHoliday(tempDate)) {
        extraStartDate.setDate(extraStartDate.getDate() - 1);
        tempDate.setDate(tempDate.getDate() - 1);
      }

      return extraStartDate;
    };

    const calculateExtraEndDate = (vacationEndDate: Date): Date => {
      const extraEndDate = new Date(vacationEndDate);
      const tempDate = new Date(vacationEndDate);
      tempDate.setDate(tempDate.getDate() + 1);

      while (isWeekendOrHoliday(tempDate)) {
        extraEndDate.setDate(extraEndDate.getDate() + 1);
        tempDate.setDate(tempDate.getDate() + 1);
      }

      return extraEndDate;
    };

    const checkForOverlaps = (
      startDate: Date,
      endDate: Date,
      existingPeriods: VacationPeriod[],
      minGapBetweenPeriods: number
    ): boolean => {
      const bufferStartDate = new Date(startDate);
      bufferStartDate.setDate(bufferStartDate.getDate() - minGapBetweenPeriods);

      const bufferEndDate = new Date(endDate);
      bufferEndDate.setDate(bufferEndDate.getDate() + minGapBetweenPeriods);

      for (const period of existingPeriods) {
        if (
          (bufferStartDate <= period.endDate && bufferEndDate >= period.startDate)
        ) {
          return true;
        }
      }

      return false;
    };

    const calculateTotalDaysOff = (period: VacationPeriod): number => {
      const totalDays = Math.floor(
        (period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      return totalDays;
    };

    const findBestAvailablePeriods = (
      startDate: Date,
      endDate: Date,
      existingPeriods: VacationPeriod[],
      daysCount: number,
      minGapBetweenPeriods: number = 3
    ): VacationPeriod[] => {
      const currentDate = new Date(startDate);
      const candidatePeriods: { period: VacationPeriod; totalDaysOff: number }[] = [];
      const maxSearchDate = new Date(endDate);

      while (currentDate <= maxSearchDate) {
        if (
          currentDate.getDay() !== 0 &&
          currentDate.getDay() !== 6 &&
          !isHoliday(currentDate)
        ) {
          const vacationStartDate = new Date(currentDate);
          const vacationEndDate = new Date(vacationStartDate);
          vacationEndDate.setDate(vacationStartDate.getDate() + daysCount - 1);

          if (vacationEndDate > maxSearchDate) {
            break;
          }

          const extraStartDate = calculateExtraStartDate(vacationStartDate);
          const extraEndDate = calculateExtraEndDate(vacationEndDate);

          const overlaps = checkForOverlaps(
            extraStartDate,
            extraEndDate,
            existingPeriods,
            minGapBetweenPeriods
          );

          if (!overlaps) {
            const period: VacationPeriod = {
              startDate: extraStartDate,
              endDate: extraEndDate,
              usedStartDate: vacationStartDate,
              usedEndDate: vacationEndDate,
              daysCount: daysCount
            };

            const totalDaysOff = calculateTotalDaysOff(period);
            candidatePeriods.push({ period, totalDaysOff });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (candidatePeriods.length === 0) {
        throw new Error("Could not find any valid vacation period within the search range");
      }

      candidatePeriods.sort((a, b) => {
        if (b.totalDaysOff !== a.totalDaysOff) {
          return b.totalDaysOff - a.totalDaysOff;
        }

        const diffA = Math.abs(a.period.usedStartDate.getTime() - startDate.getTime());
        const diffB = Math.abs(b.period.usedStartDate.getTime() - startDate.getTime());
        return diffA - diffB;
      });

      return candidatePeriods.map(cp => cp.period);
    };

    // Collect all candidate periods for all vacation day counts
    const allCandidatePeriods: VacationPeriod[] = [];

    for (let vacationDays = minVacationDays; vacationDays <= maxVacationDays; vacationDays++) {
      try {
        const periods = findBestAvailablePeriods(
          currentStartDate,
          searchEndDate,
          [],
          vacationDays,
          0
        );
        allCandidatePeriods.push(...periods);
      } catch {
        // Continue if no valid periods found for this vacation day count
        console.warn(`No valid periods found for ${vacationDays} vacation days`);
      }
    }

    // Filter out periods with 0 extra days and sort by extra days (descending), then by start date (ascending)
    const filteredPeriods = allCandidatePeriods.filter(period => {
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

      // If extra days are equal, sort by start date
      return a.usedStartDate.getTime() - b.usedStartDate.getTime();
    });

    setVacationPeriods(filteredPeriods);
    setShowCalendars(true);
    setExpandedExtraDays(new Set());
    setExpandedPeriods(new Set());
  };

  const handleStartDateChange = (date: Date): void => {
    setFormData({
      ...formData,
      startDate: date,
    });
  };

  const handleEndDateChange = (date: Date): void => {
    setFormData({
      ...formData,
      endDate: date,
    });
  };

  const getStartDateErrorMessage = (): string | null => {
    if (!formData.startDate || isNaN(formData.startDate.getTime())) {
      return "Please enter a valid start date";
    }
    return null;
  };

  const getEndDateErrorMessage = (): string | null => {
    if (!formData.endDate || isNaN(formData.endDate.getTime())) {
      return "Please enter a valid end date";
    }
    if (
      formData.startDate &&
      formData.endDate &&
      !isNaN(formData.startDate.getTime()) &&
      !isNaN(formData.endDate.getTime()) &&
      formData.endDate <= formData.startDate
    ) {
      return "End date must be after start date";
    }
    return null;
  };

  const CalendarMonth: React.FC<CalendarMonthProps> = ({
    month,
    startDate,
    endDate,
    usedStartDate,
    usedEndDate,
    dayNames,
  }) => {
    const monthName = month.toLocaleString("default", { month: "long" });
    const year = month.getFullYear();
    const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month.getMonth(), 1).getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const isWeekend = (date: Date): boolean => {
      const day = date.getDay();
      return day === 0 || day === 6;
    };

    const isHolidayDate = (date: Date): boolean => {
      return isHoliday(date);
    };

    const getHolidayName = (date: Date): string => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const holiday = holidays.find((h) => {
        const holidayDate = new Date(h.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === normalizedDate.getTime();
      });

      return holiday ? holiday.name : "";
    };

    return (
      <div className="text-center">
        <h4 className="mb-2">
          {monthName} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="text-xs text-gray-500 py-1">
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

            const currentDate = new Date(year, month.getMonth(), day);
            currentDate.setHours(0, 0, 0, 0);

            const vacationStart = new Date(usedStartDate);
            vacationStart.setHours(0, 0, 0, 0);

            const vacationEnd = new Date(usedEndDate);
            vacationEnd.setHours(0, 0, 0, 0);

            const fullStart = new Date(startDate);
            fullStart.setHours(0, 0, 0, 0);

            const fullEnd = new Date(endDate);
            fullEnd.setHours(0, 0, 0, 0);

            const currentTime = currentDate.getTime();
            const isVacationDay =
              currentTime >= vacationStart.getTime() &&
              currentTime <= vacationEnd.getTime();

            const isExtraDay =
              ((currentTime >= fullStart.getTime() &&
                currentTime < vacationStart.getTime()) ||
                (currentTime > vacationEnd.getTime() &&
                  currentTime <= fullEnd.getTime())) &&
              (isWeekend(currentDate) || isHolidayDate(currentDate));

            const showHolidayIcon = isHolidayDate(currentDate);
            const holidayName = showHolidayIcon
              ? getHolidayName(currentDate)
              : "";

            let className = "text-sm py-1 ";
            if (isVacationDay) {
              className += "rounded-full bg-indigo-500 text-white font-medium";
            } else if (isExtraDay) {
              className +=
                "rounded-full bg-indigo-100 text-indigo-800 font-medium";
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
  };

  const CalendarView: React.FC<CalendarViewProps> = ({
    startDate,
    endDate,
    usedStartDate,
    usedEndDate,
    daysCount,
  }) => {
    const months: Date[] = [];
    const displayStart = startDate;
    const displayEnd = endDate;
    const currentMonth = new Date(
      displayStart.getFullYear(),
      displayStart.getMonth(),
      1
    );
    const lastMonth = new Date(
      displayEnd.getFullYear(),
      displayEnd.getMonth(),
      1
    );

    while (currentMonth <= lastMonth) {
      months.push(new Date(currentMonth));
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const usedDays = daysCount;

    let totalDays = 0;

    const currentDate = new Date(startDate);
    const endDateValue = new Date(endDate);

    currentDate.setHours(0, 0, 0, 0);
    endDateValue.setHours(0, 0, 0, 0);

    while (currentDate <= endDateValue) {
      totalDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const extraDays = totalDays - usedDays;

    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return (
      <div>
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-center">
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500">Start</div>
              <div>{formatDate(usedStartDate)}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500">End</div>
              <div>{formatDate(usedEndDate)}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500">Vacation Days</div>
              <div>{usedDays}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500">Extra Days</div>
              <div>{extraDays}</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-xs text-gray-500">Total Days</div>
              <div>{totalDays}</div>
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
              dayNames={dayNames}
            />
          ))}
        </div>

        <div className="flex items-center justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-500 rounded-full mr-2"></div>
            <span className="text-sm">Vacation Days</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-100 rounded-full mr-2"></div>
            <span className="text-sm">Extra Days</span>
          </div>
        </div>
      </div>
    );
  };

  const countryOptions: SelectOption[] = Object.entries(hd.getCountries())
    .map(([code, name]) => ({
      value: code,
      label: name as string,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const stateOptions: SelectOption[] = formData.workCountry
    ? [
        { value: undefined, label: "-" },
        ...Object.entries(hd.getStates(formData.workCountry) || {})
          .map(([code, name]) => ({
            value: code,
            label: name as string,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            Vacation Calculator
          </div>
          <div className="text-lg text-gray-600">
            Find the best vacation periods to maximize extra days off
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
          {/* Form Column */}
          <div>
            <Card>
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <div className="text-lg text-gray-800">Vacation Calculator</div>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none transition-transform duration-300 ease-in-out transform"
                  style={{
                    transform: isMinimized ? "rotate(0deg)" : "rotate(180deg)",
                  }}
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? "+" : "−"}
                </button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isMinimized ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                }`}
              >
                <div className="p-6">
                  <FormSection>
                    <SelectField
                      label="Work Country"
                      name="workCountry"
                      value={formData.workCountry}
                      icon="🌎"
                      options={countryOptions}
                      tooltip="Select the country where you work"
                      onChange={handleInputChange}
                    />

                    <SelectField
                      label="Work State"
                      name="workState"
                      value={formData.workState}
                      icon="🏙️"
                      options={stateOptions}
                      tooltip="Select the state where you work"
                      onChange={handleInputChange}
                    />
                  </FormSection>

                  <FormSection>
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

                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8">
                    <div className="text-indigo-600 mb-4 sm:mb-0">
                      Find the best vacation periods with maximum extra days
                    </div>
                    <button
                      type="button"
                      onClick={handleCalculate}
                      disabled={hasErrors()}
                      className={`px-8 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        hasErrors()
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      Calculate
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Column */}
          <div>
            {showCalendars ? (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Vacation Periods with Extra Days Off
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Grouped by number of extra days (weekends & holidays), sorted by earliest start date
                </p>

                <Card className="p-4">
                  {(() => {
                    // Group periods by extra days
                    const periodsByExtraDays = new Map<number, VacationPeriod[]>();

                    vacationPeriods.forEach(period => {
                      const totalDays = Math.floor(
                        (period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)
                      ) + 1;
                      const extraDays = totalDays - period.daysCount;

                      if (!periodsByExtraDays.has(extraDays)) {
                        periodsByExtraDays.set(extraDays, []);
                      }
                      periodsByExtraDays.get(extraDays)!.push(period);
                    });

                    // Sort by extra days (descending)
                    const sortedExtraDays = Array.from(periodsByExtraDays.keys()).sort((a, b) => b - a);

                    const formatDate = (date: Date): string => {
                      const day = date.getDate().toString().padStart(2, "0");
                      const month = (date.getMonth() + 1).toString().padStart(2, "0");
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    };

                    return (
                      <div className="space-y-2">
                        {sortedExtraDays.map((extraDays) => {
                          const periods = periodsByExtraDays.get(extraDays)!;
                          const isExtraDaysExpanded = expandedExtraDays.has(extraDays);

                          return (
                            <div key={extraDays} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Level 1: Extra Days Row */}
                              <button
                                className="w-full px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-left flex items-center justify-between transition-colors"
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
                                <span className="font-semibold text-indigo-900">
                                  {extraDays} Extra Days ({periods.length} option{periods.length !== 1 ? 's' : ''})
                                </span>
                                <span className="text-indigo-600">
                                  {isExtraDaysExpanded ? '▼' : '▶'}
                                </span>
                              </button>

                              {/* Level 2: Date Ranges (when extra days row is expanded) */}
                              {isExtraDaysExpanded && (
                                <div className="bg-white">
                                  {periods.map((period, index) => {
                                    const periodKey = `${extraDays}-${index}`;
                                    const isPeriodExpanded = expandedPeriods.has(periodKey);

                                    return (
                                      <div key={periodKey} className="border-t border-gray-200">
                                        {/* Date Range Row */}
                                        <button
                                          className="w-full px-6 py-3 hover:bg-gray-50 text-left flex items-center justify-between transition-colors"
                                          onClick={() => {
                                            const newExpanded = new Set(expandedPeriods);
                                            if (isPeriodExpanded) {
                                              newExpanded.delete(periodKey);
                                            } else {
                                              newExpanded.add(periodKey);
                                            }
                                            setExpandedPeriods(newExpanded);
                                          }}
                                        >
                                          <div className="flex items-center space-x-4">
                                            <span className="text-gray-700">
                                              {formatDate(period.usedStartDate)} - {formatDate(period.usedEndDate)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              ({period.daysCount} vacation days)
                                            </span>
                                          </div>
                                          <span className="text-gray-400">
                                            {isPeriodExpanded ? '▼' : '▶'}
                                          </span>
                                        </button>

                                        {/* Level 3: Calendar (when date range is expanded) */}
                                        {isPeriodExpanded && (
                                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
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
              <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
                <div className="text-gray-400 text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <div className="text-lg">Results will appear here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationCalculator;
