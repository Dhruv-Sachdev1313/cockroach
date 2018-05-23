import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { InjectedRouter, RouterState } from "react-router";

import Dropdown, { DropdownOption } from "src/views/shared/components/dropdown";
import { PageConfig, PageConfigItem } from "src/views/shared/components/pageconfig";

import { AdminUIState } from "src/redux/state";
import { refreshDatabases } from "src/redux/apiReducers";

import DatabaseSummaryTables from "src/views/databases/containers/databaseTables";
import DatabaseSummaryGrants from "src/views/databases/containers/databaseGrants";
import NonTableSummary from "./nonTableSummary";

const databasePages = [
  { value: "tables", label: "Tables" },
  { value: "grants", label: "Grants" },
];

// DatabaseListNav displays the database page navigation bar.
class DatabaseListNav extends React.Component<{selected: string}, {}> {
  // Magic to add react router to the context.
  // See https://github.com/ReactTraining/react-router/issues/975
  // TODO(mrtracy): Switch this, and the other uses of contextTypes, to use the
  // 'withRouter' HoC after upgrading to react-router 4.x.
  static contextTypes = {
    router: PropTypes.object.isRequired,
  };
  context: { router: InjectedRouter & RouterState; };

  render() {
    return <PageConfig>
      <PageConfigItem>
        <Dropdown title="View" options={databasePages} selected={this.props.selected}
                  onChange={(selected: DropdownOption) => {
                    this.context.router.push(`databases/${selected.value}`);
                  }} />
      </PageConfigItem>
    </PageConfig>;
  }
}

// DatabaseListData describes properties which should be passed to the
// DatabaseList container.
interface DatabaseListData {
  // A list of databases.
  databaseNames: string[];
}

// DatabaseListActions describes actions that can be dispatched by a
// DatabaseList component.
interface DatabaseListActions {
  refreshDatabases: typeof refreshDatabases;
}

type DatabaseListProps = DatabaseListData & DatabaseListActions;

// DatabaseTablesList displays the "Tables" sub-tab of the main database page.
class DatabaseTablesList extends React.Component<DatabaseListProps, {}> {
  componentWillMount() {
    this.props.refreshDatabases();
  }

  render() {
    return <div>
      <Helmet>
        <title>Tables | Databases</title>
      </Helmet>
      <section className="section"><h1>Databases</h1></section>
      <DatabaseListNav selected="tables"/>
      <div className="section databases">
        { _.map(this.props.databaseNames, (n) => {
          return <DatabaseSummaryTables name={n} key={n} />;
        }) }
        <NonTableSummary />
      </div>
    </div>;
  }
}

// DatabaseTablesList displays the "Grants" sub-tab of the main database page.
class DatabaseGrantsList extends React.Component<DatabaseListProps, {}> {
  componentWillMount() {
    this.props.refreshDatabases();
  }

  render() {
    return <div>
      <Helmet>
        <title>Grants | Databases</title>
      </Helmet>
      <section className="section"><h1>Databases</h1></section>
      <DatabaseListNav selected="grants"/>
      <div className="section databases">
        { _.map(this.props.databaseNames, (n) => {
          return <DatabaseSummaryGrants name={n} key={n} />;
        }) }
      </div>
    </div>;
  }
}

const systemDatabases = [
  "defaultdb",
  "postgres",
  "system",
];

function cmp(a: string, b: string) {
  if (a === b) {
      return 0;
  }
  if (a < b) {
      return -1;
  }
  return 1;
}

function systemLast(a: string, b: string) {
  const aIsSys = systemDatabases.indexOf(a) !== -1;
  const bIsSys = systemDatabases.indexOf(b) !== -1;
  if (aIsSys && bIsSys) {
    return cmp(a, b);
  }
  if (aIsSys) {
      return 1;
  }
  if (bIsSys) {
      return -1;
  }
  return cmp(a, b);
}

// Base selectors to extract data from redux state.
function databaseNames(state: AdminUIState): string[] {
  if (state.cachedData.databases.data && state.cachedData.databases.data.databases) {
    return state.cachedData.databases.data.databases.sort(systemLast);
  }
  return [];
}

// Connect the DatabaseTablesList class with our redux store.
const databaseTablesListConnected = connect(
  (state: AdminUIState) => {
    return {
      databaseNames: databaseNames(state),
    };
  },
  {
    refreshDatabases,
  },
)(DatabaseTablesList);

// Connect the DatabaseGrantsList class with our redux store.
const databaseGrantsListConnected = connect(
  (state: AdminUIState) => {
    return {
      databaseNames: databaseNames(state),
    };
  },
  {
    refreshDatabases,
  },
)(DatabaseGrantsList);

export {
  databaseTablesListConnected as DatabaseTablesList,
  databaseGrantsListConnected as DatabaseGrantsList,
};
