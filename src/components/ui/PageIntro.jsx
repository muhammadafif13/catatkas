export default function PageIntro({ title, text, actions }) {
  return (
    <div className="page-intro">
      <div>
        <h1 className="page-intro__title">{title}</h1>
        {text ? <p className="page-intro__text">{text}</p> : null}
      </div>
      {actions ? <div className="page-intro__actions">{actions}</div> : null}
    </div>
  );
}
