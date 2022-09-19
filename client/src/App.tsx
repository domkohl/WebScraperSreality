/* eslint-disable jsx-a11y/alt-text */
import { useTable, usePagination } from "react-table";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
function App() {
  const [offers, setOffers] = useState([{ image: "" }]);
  const [loading, setLoading] = useState(true);
  async function getOffers() {
    setLoading(true);
    const result = (await axios.get("http://localhost:5000/offers")).data;
    setOffers(result);
    setLoading(false);
  }
  async function updateOffers() {
    setLoading(true);
    const result = (await axios.patch("http://localhost:5000/offers")).data;

    if (result.status === "ok") {
      await getOffers();
    }
    setLoading(false);
  }
  const columns = useMemo(
    () => [
      {
        Header: "Image",
        accessor: "image",
        Cell: ({ value }) => (
          <a
            target="_blank"
            href={value} rel="noreferrer"
          >
            <img
              width="65"
              src={value}
            />
          </a>
        ),
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Location",
        accessor: "locality",
      },
      {
        Header: "Price",
        accessor: "price",
      },
    ],
    []
  );
  useEffect(() => {
    getOffers();
  }, []);

  function Table({ columns, data }) {
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      prepareRow,
      page,
      canPreviousPage,
      canNextPage,
      pageOptions,
      pageCount,
      gotoPage,
      nextPage,
      previousPage,
      setPageSize,
      state: { pageIndex, pageSize },
    } = useTable(
      {
        columns,
        data,
        initialState: { pageIndex: 0 },
      },
      usePagination
    );
    return (
      <>
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div>
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            {"<<"}
          </button>{" "}
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {"<"}
          </button>{" "}
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {">"}
          </button>{" "}
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            {">>"}
          </button>{" "}
          <span>
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{" "}
          </span>
          <span>
            | Go to page:{" "}
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
              style={{ width: "100px" }}
            />
          </span>{" "}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </>
    );
  }
  return (
    <div className="App">
      <div>
        <button disabled={loading} onClick={() => updateOffers()}>
          Update offers
        </button>
      </div>
      <div className="loader" hidden={!loading}></div>
      {loading ? (
        <></>
      ) : (
        <>
          <br /> <Table columns={columns} data={offers} />
        </>
      )}
    </div>
  );
}

export default App;
