import './Sidebar.css';
import {Card, CardContent, CardMedia, Divider, Stack, Typography} from "@mui/material";
import SidebarItem from "../sidebarItem/SidebarItem";
import Logo from "../logo/Logo";
import HomeIcon from '@mui/icons-material/Home';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PersonIcon from '@mui/icons-material/Person';
import pic from "../../images/superalgos.png";
import React from "react";

const Sidebar = props => {
    const menuOptions = [{name: "Home", icon: HomeIcon},
        {name: "Profile", icon: PersonIcon},
        {name: "Post", icon: PostAddIcon}
        /*, "Explore", "Notifications", "Messages", "Bookmarks", "Lists", "More"*/]

    const menuItems = menuOptions.map(option => {
        return <SidebarItem key={option.name} Icon={option.icon} value={option.name}/>
    })

    return (
        <div className="sidebar">
            <Stack direction="column"
                   justifyContent="flex-start"
                   alignItems="center"
                   spacing={5}
                   sx={{minWidth: "max-content"}}>
                <Logo/>
                <Stack
                    direction="column"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    divider={<Divider orientation="horizontal" flexItem/>}>
                    {menuItems}
                </Stack>
            </Stack>
            <Card className="sidebarProfileCard" variant="outlined">
                <CardMedia className="avatar"
                           component="img"
                           image={pic}
                           alt="PP"

                />
                <SidebarUserProfile/>
            </Card>
        </div>
    );
}

export default Sidebar;
