create a comprehensive analytics dashboard following below design:

There're three main element how to define what to show in the dashboard:

(1) Dimension (as the stacked colored segments): provider, requestedModel,possible fields in the metadataJson, such as env, team, department, application etc. X axis Demon is always the date.

(2) Metrics:totalToken,cost, request count

(3) Filter: possible fields in the metadataJson, such as env, team, department, application, user_name, log date range (Must have, such as last 7 days, last 30 days, or the specific date range that allow the user to pick)

Metrics is used to defined the Y axis of the chart.
Date is used to defined the X axis of the chart.

Main Visualization chart types: Stacked bar chart

Design and implement this analytics dashboard end by end including the server actions to fetch the data, frontend components design, and the frontend code to render the dashboard. Try to implement it in a straightforward, module-based way, with high code quality, sense of beauty and professional, and model analytics design.

Example:
Chart image: https://assets.grok.com/users/77c07306-9f97-4975-bf46-cdd0dc392483/d71af202-28c4-4560-b258-72c82c52d6ff/content
The stacked bar chart attached as a url, the dimension is env, Production, Staging, Internal
The metrics is request count,
the filter only applied is last 7 days only.
