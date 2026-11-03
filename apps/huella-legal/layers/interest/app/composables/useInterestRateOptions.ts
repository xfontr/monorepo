import type { RadioGroupItem } from "@nuxt/ui";
import type { InterestRate } from "../types/InterestRate";

/** The radio items for the given rates, each preset labelled with its percentage. */
export const useInterestRateOptions = (rates: readonly InterestRate[]) => {
    const { t, locale } = useI18n();

    return computed<RadioGroupItem[]>(() => {
        const percent = new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 });

        return rates.map((value) => ({
            value,
            label:
                value === "custom"
                    ? t("interestCalculator.rate.options.custom")
                    : t(`interestCalculator.rate.options.${value}`, {
                          percent: percent.format(INTEREST_RATES[value]),
                      }),
        }));
    });
};
