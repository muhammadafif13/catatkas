export default function PublicSectionHeading({
  eyebrow,
  title,
  description,
  tone = 'default',
  align = 'start',
}) {
  return (
    <header
      className={`public-section-heading public-section-heading--${tone} public-section-heading--${align}`}
    >
      {eyebrow ? (
        <p className="public-section-heading__eyebrow">
          <span aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}
      <h2>{title}</h2>
      {description ? <p className="public-section-heading__description">{description}</p> : null}
    </header>
  );
}
