"use client";

import React, { useState } from "react";
import { MailOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";

const { Header } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    label: "Text",
    key: "text",
    icon: <MailOutlined />,
    children: [
      {
        label: "Share Text",
        key: "share_text",
      },
      {
        label: "Get Text",
        key: "get_text",
      },
    ],
  },
];

const TopMenuBar: React.FC = () => {
  const [current, setCurrent] = useState("text");

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  return (
    <Layout>
      <Header
        style={{
          backgroundColor: "white",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Menu
          onClick={onClick}
          selectedKeys={[current]}
          mode="horizontal"
          items={items}
        />
      </Header>
    </Layout>
  );
};

export default TopMenuBar;
