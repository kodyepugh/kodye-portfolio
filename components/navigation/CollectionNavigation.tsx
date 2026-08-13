type CollectionNavigationProps = {
  depth: number;
  disabled: boolean;
  onBack: () => void;
  onHome: () => void;
};

export function CollectionNavigation({
  depth,
  disabled,
  onBack,
  onHome,
}: CollectionNavigationProps) {
  if (depth === 0) return null;

  return (
    <nav
      className="collection-navigation"
      aria-label="Collection navigation"
      data-collection-navigation-depth={depth}
    >
      <button
        type="button"
        className="collection-navigation__control"
        aria-label="Return to Home collection"
        disabled={disabled}
        onClick={onHome}
      >
        Home
      </button>
      {depth >= 2 ? (
        <button
          type="button"
          className="collection-navigation__control"
          aria-label="Return to previous collection"
          disabled={disabled}
          onClick={onBack}
        >
          Back
        </button>
      ) : null}
    </nav>
  );
}
