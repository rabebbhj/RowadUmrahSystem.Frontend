import { CalendarIcon, ChevronDownIcon, LocationIcon, SearchIcon, UsersIcon } from "./landingShared";

export function SearchBar({ onSearch }: { onSearch: () => void }) {
  const fields = [
    { title: "عدد المعتمرين", placeholder: "اختر العدد", icon: <UsersIcon className="icon icon-sm" /> },
    { title: "المدينة", placeholder: "اختر المدينة", icon: <LocationIcon className="icon icon-sm" /> },
    { title: "المدة", placeholder: "اختر المدة", icon: <ChevronDownIcon className="icon icon-sm" /> },
    { title: "تاريخ الانطلاق", placeholder: "اختر التاريخ", icon: <CalendarIcon className="icon icon-sm" /> }
  ];

  return (
    <section className="search-shell">
      <div className="container search-bar">
        <button className="search-bar__submit btn btn-gold" type="button" onClick={onSearch}>
          <SearchIcon className="icon icon-sm" />
          <span>بحث</span>
        </button>

        {fields.map((field) => (
          <div key={field.title} className="search-bar__field">
            <span className="search-bar__title">{field.title}</span>
            <button className="search-bar__input" type="button">
              <span>{field.placeholder}</span>
              {field.icon}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
