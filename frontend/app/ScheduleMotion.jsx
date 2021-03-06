import React from 'react';

import { 
    Flex,
    Modal, 
    Button,
    SegmentedControl,
    DatePicker,
    List,
    Checkbox,
    WhiteSpace,
    Toast,
    InputItem
} from 'antd-mobile';

import {request, jsonProcessing} from './../js/request.js'
import moment from 'moment';
import TimeRangePicker from './TimeRangePicker.jsx';
import WeekdayPicker from './WeekdayPicker.jsx';
import { cronString, cronState } from '../js/lib/cronString.js'

class ScheduleMotion extends React.Component{

    constructor(props){
        super(props)
        this.state ={
            weekdays: {
                Sunday:     true,
                Monday:     true,
                Tuesday:    true,
                Wednesday:  true,
                Thursday:   true,
                Friday:     true,
                Saturday:   true,
            },
            startTime: moment().toDate(),
            endTime: moment().toDate(),
            visible: false,
            running: false,
        }
    }

    componentDidMount = () => {
        this.updateScheduling()
    }

    updateScheduling = () => {
        request("/taskCheck", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: "/motionStart"
            })
        }, (prom) => {
            jsonProcessing(prom, (data) => {
                console.log(data)
                this.setState(() => {
                    const {
                        weekdays,
                        date,
                        running
                    } = cronState(data.cronString)
                    return {
                        weekdays,
                        startTime: date,
                        running
                    }
                })
            })
        })
        request("/taskCheck", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: "/motionStop"
            })
        }, (prom) => {
            jsonProcessing(prom, (data) => {
                console.log(data)
                this.setState(() => {
                    const {
                        weekdays,
                        date,
                        running
                    } = cronState(data.cronString)
                    return {
                        weekdays,
                        endTime: date,
                        running
                    }
                })
            
            })
        })
    }

    openModal = () => {
        this.setState(() => ({visible: true}))
    }

    closeModal = () => {
        this.setState(() => ({visible: false}), this.props.update)
    }

    stopTask = () => {
        request("/taskDestroy", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: "/motionStart"
            })
        }, (prom) => {
            jsonProcessing(prom, (data) => {
                console.log(data)
            })
            this.updateScheduling()
        })
        request("/taskDestroy", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: "/motionStop"
            })
        }, (prom) => {
            jsonProcessing(prom, (data) => {
                console.log(data)
            })
            this.updateScheduling()
        })
    }

    startTask = () => {
        console.log(cronString(this.state.weekdays, this.state.startTime), cronString(this.state.weekdays, this.state.endTime))
        request("/taskSchedule", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: "/motionStart",
                cronString: cronString(this.state.weekdays, this.state.startTime),
            })
        }, (prom) => {
            jsonProcessing(prom, (data) => {
                console.log(data)
            })
            this.updateScheduling()
        })
        request("/taskSchedule", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: "/motionStop",
                cronString: cronString(this.state.weekdays, this.state.endTime),
            })
        }, (prom) => {
            jsonProcessing(prom, (data) => {
                console.log(data)
            })
            this.updateScheduling()
        })
    }

    render () {
        return (<Flex.Item>
            <Button icon="check-circle-o" onClick={this.openModal}>
                SCHEDULE
            </Button>
            <Modal
                popup
                maskClosable
                visible={this.state.visible}
                onClose={this.closeModal}
                animationType="slide-up"
            >
                <List>
                    <List.Item
                        arrow="down"
                        onClick={this.closeModal}
                    >
                        Scheduling: {this.state.running ? "On" : "Off"}
                    </List.Item>
                    <WeekdayPicker weekdays={this.state.weekdays} onChange = {(weekday, checked) => {
                        if(checked != undefined){
                            this.setState((oldState) => {
                                oldState.weekdays[weekday] = checked
                                return { weekdays: oldState.weekdays }
                            })
                        }
                        else{
                            this.setState(() => {
                                return { weekdays: weekday }
                            })
                        }
                    }}/>
                    <TimeRangePicker 
                        startTime= {this.state.startTime}
                        startChange = {time => this.setState({ startTime: time })}
                        endTime= {this.state.endTime}
                        endChange = {time => this.setState({ endTime: time })}
                    />
                    
                </List>
                <Flex>
                    <Flex.Item>
                        <Button icon="check-circle-o" onClick={this.stopTask}>STOP</Button>
                    </Flex.Item>
                    <Flex.Item>
                        <Button icon="check-circle-o" onClick={this.startTask}>START</Button>
                    </Flex.Item>
                </Flex>
            </Modal>
        </Flex.Item>)
    }

}

export default ScheduleMotion