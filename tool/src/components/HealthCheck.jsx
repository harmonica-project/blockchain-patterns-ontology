import React, { useState, useEffect } from 'react';
import { healthCheck } from '../libs/fuseki';
import { makeStyles } from '@mui/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Typography } from '@mui/material';

const useStyles = makeStyles((theme) => ({
    block: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap'
    }
  }));

export default function HealthCheck(props) {
    const classes = useStyles();

    const [isUp, setIsUp] = useState(false)

    const checkHealthCheck = async () => {
        setIsUp(await healthCheck())
    }

    const displayHealthCheck = () => {
        if (isUp) return <CheckCircleIcon color="success" />
        return <CancelIcon color="error" />
    }

    useEffect(() => {
        checkHealthCheck()
    }, []);

    return (
        <div className={classes.block}>
            {displayHealthCheck()}
            &nbsp;&nbsp;
            <Typography {...props}>
                {isUp ? "Connected": "Disconnected"} - Apache Fuseki
            </Typography>
        </div>
    );

}