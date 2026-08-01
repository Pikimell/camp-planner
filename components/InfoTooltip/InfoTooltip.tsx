import css from "./InfoTooltip.module.css";

type InfoTooltipProps = {
  label: string;
};

const InfoTooltip = ({ label }: InfoTooltipProps) => {
  return (
    <span className={css["tooltip"]}>
      <button
        aria-label={label}
        className={css["trigger"]}
        title={label}
        type="button"
      >
        ?
      </button>
      <span className={css["content"]} role="tooltip">
        {label}
      </span>
    </span>
  );
};

export default InfoTooltip;
