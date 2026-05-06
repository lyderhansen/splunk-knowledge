# SPL2-related REST notes

Pointers for SPL2 namespaces and supporting REST endpoints (datasets, dispatch, convert, modules, permissions).

This documentation is designed for Splunk users who are creating SPL2 searches and modules, and for application developers and Splunk administrators who are creating or managing SPL2-based applications.
SPL2 namespaces
For the SPL2
datasets
,
dispatch
, and
convert
endpoints you can include the servicesNS node in your endpoint path to ensure that you are accessing the resource in the user and app contexts. However, the servicesNS node is not supported for the
modules
and
permissions
endpoints. See
Namespace
in the
Splunk Enterprise REST API User Manual
.
SPL2 documentation
Use the
SPL2 Overview
to learn which products and applications support using SPL2, the differences between SPL and SPL2, and see the SPL2 Release Notes.
Use the
SPL2 Search Manual
to understand how to use SPL2 commands effectively. You'll learn the relationships between modules and namespaces, how SPL2 statements are used, and how to create custom functions and custom data types.
The
SPL2 Search Reference
contains information about the SPL2 search commands, command syntax, and built-in functions. See the examples provided for each of the commands and functions supported in SPL2.
For application developers and admins, see:
Create SPL2-based apps
in the
Splunk Developer Guide
on dev.splunk.com.
Splunk Enterprise
: in the
Splunk Enterprise Admin Manual
.
Splunk Cloud Platform
: in the
Splunk Cloud Platform Admin Manual
.