import React, { Component } from "react";
import classnames from "classnames";
import Loading from 'components/Loading';
import Panel from 'components/Panel';
import axios from 'axios';
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";
 import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
   };

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if(focused) {
      this.setState({focused});
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      // console.log("days: ", days.data);
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
     });

     this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

     this.socket.onmessage = event => {
       const data = JSON.parse(event.data);
      //  console.log("web socket data: ", data);

       if(typeof data === "object" && data.type == "SET_INTERVIEW"){
         this.setState(prevState => setInterview(prevState, data.id, data.interview));
       }
     }
  } //closing compDidMount

  componentDidUpdate(prevProps, prevState) {
    if(prevState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  //arrow function binds Function declaration to "this"
  // selectPanel = (id) => {
  //   this.setState({focused: id});
  // }  

  //alternatively arrow function to binf "this" can be used inside the render block, line 56
  selectPanel(id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
  }

  render() {
    // console.log("this.state:", this.state)
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    if (this.state.loading) {
      return <Loading />;
    }
  
    const panelsArr = data
      .filter((panel) => {
        return this.state.focused === null || this.state.focused === panel.id })
      .map((panel) => {
      return (
        <Panel 
          key={panel.id} 
          id={panel.id} 
          label={panel.label} 
          value={panel.getValue(this.state)} 
          onSelect={event => this.selectPanel(panel.id)}/>
      );
    });    

    return (
      <main className={dashboardClasses}> {panelsArr} </main> 
    );
  }
}

export default Dashboard;
